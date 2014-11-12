package net.nationstatesplusplus.assembly.auth;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.concurrent.TimeUnit;

import net.nationstatesplusplus.assembly.util.DatabaseAccess;
import net.nationstatesplusplus.assembly.util.Sha;

import play.Logger;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;

/**
 * Represents rss-key based authentication for nationstates nations
 */
public class Authentication {
	private final String nation;
	private final int nationId;
	private final int rssKey;
	private final DatabaseAccess access;
	private String failureReason = null;
	public Authentication(String nation, int nationId, int rssKey, DatabaseAccess access) {
		this.nation = nation;
		this.nationId = nationId;
		this.rssKey = rssKey;
		this.access = access;
	}

	/**
	 * Returns true if the rss key, is valid. Validation first checks to see if the database contains the salted sha256 hash of the key.
	 * If the hash is not in the database, or the hash does not match the database value, and this authentication attempt is not too recent
	 *  (> 1 min since the previous attempt), then a connection to nationstates is opened to verify the rss key.
	 *  If the rss key is confirmed valid, a salted sha256 hash of the key is stored in the database to avoid unnecessary future nationstates calls.
	 *  <p>
	 *  If the authentication is not valid, a failure reason will be available from getFailureReason
	 * 
	 * @return if the authentication is valid
	 */
	public boolean isValid() {
		Hashsums hash = getHashFromDatabase();
		if (hash != null) {
			//If the hash check fails with the database value, it may be because the user revoked and regenerated the feed, can't assume they are invalid
			
			//Try the nation's sha256 hash of the rss key first
			if (hash.shaHash != null) {
				String calculatedHash = Sha.hash256(String.valueOf(rssKey) + String.valueOf(hash.shaSalt));
				if (calculatedHash.equals(hash.shaHash)) {
					return true;
				}
			}
			
			//Check the nation's bcrypt hash of the rss key next
			if (hash.bcryptHash != null) {
				if (BCrypt.checkpw(String.valueOf(rssKey), hash.bcryptHash)) {
					migrateBcryptHash(rssKey);
					return true;
				}
			}
		}
		if (LAST_RSS_AUTHENTICATION_ATTEMPT.getIfPresent(nationId) != null) {
			failureReason = "Authentication attempt too soon after previous request";
			return false;
		}
		LAST_RSS_AUTHENTICATION_ATTEMPT.put(nationId, true);
		try {
			if (!verifyRSSPage()) {
				failureReason = "rss key returned invalid response code";
				return false;
			}
		} catch (IOException e) {
			Logger.error("unable to verify RSS page", e);
			failureReason = "Unknown error process rss key authentication";
			return false;
		}
		final long salt = System.nanoTime();
		final String shaHash = Sha.hash256(String.valueOf(rssKey) + String.valueOf(salt));
		updateDatabaseHash(shaHash, salt);
		return true;
	}

	private void migrateBcryptHash(int rssKey) {
		final long salt = System.nanoTime();
		final String shaHash = Sha.hash256(String.valueOf(rssKey) + String.valueOf(salt));
		updateDatabaseHash(shaHash, salt);
		try (Connection conn = access.getPool().getConnection()) {
			try (PreparedStatement update = conn.prepareStatement("UPDATE assembly.nation_auth SET rss_hash = NULL WHERE nation_id = ?")) {
				update.setInt(1, nationId);
				update.execute();
			}
		} catch (SQLException e) {
			Logger.error("SQLException retreiving SQL rss hash", e);
		}
	}

	/**
	 * Returns the failure reason if the authentication is invalid, or null if the authentication has not been checked, or was valid.
	 * 
	 * @return failure reason or null if no failure has occurred
	 */
	public String getFailureReason() {
		return failureReason;
	}

	private boolean verifyRSSPage() throws IOException {
		URL url = new URL("https://www.nationstates.net/cgi-bin/rss.cgi?nation=" + nation + "&key=" + rssKey);
		HttpURLConnection conn =  (HttpURLConnection) url.openConnection();
		conn.setRequestProperty("User-Agent", "--NationStates++ RSS Authenticator--");
		conn.connect();
		if (conn.getResponseCode() / 100 == 2) {
			return true;
		}
		return false;
	}

	private void updateDatabaseHash(String hash, long salt) {
		access.generateAuthToken(nationId, true, hash, salt);
	}

	private Hashsums getHashFromDatabase() {
		try (Connection conn = access.getPool().getConnection()) {
			try (PreparedStatement select = conn.prepareStatement("SELECT rss_hash, rss_sha_hash, rss_salt FROM assembly.nation_auth WHERE nation_id = ?")) {
				select.setInt(1, nationId);
				try (ResultSet result = select.executeQuery()) {
					if (result.next()) {
						String bcryptHash = result.getString(1);
						if (result.wasNull()) {
							bcryptHash = null;
						}
						String shaHash = result.getString(2);
						if (result.wasNull()) {
							shaHash = null;
						}
						long shaSalt = result.getLong(3);
						if (result.wasNull()) {
							shaSalt = 0;
						}
						return new Hashsums(bcryptHash, shaHash, shaSalt);
					}
				}
			}
		} catch (SQLException e) {
			Logger.error("SQLException retreiving SQL rss hash", e);
		}
		return null;
	}

	private static class Hashsums {
		private final String bcryptHash;
		private final String shaHash;
		private final long shaSalt;
		Hashsums(String bcryptHash, String shaHash, long shaSalt) {
			this.bcryptHash = bcryptHash;
			this.shaHash = shaHash;
			this.shaSalt = shaSalt;
		}
	}

	private static final Cache<Integer, Boolean> LAST_RSS_AUTHENTICATION_ATTEMPT = CacheBuilder.newBuilder().expireAfterWrite(1, TimeUnit.MINUTES).build();
}
