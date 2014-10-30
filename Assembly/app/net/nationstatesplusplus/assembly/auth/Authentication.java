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

import org.joda.time.DateTime;

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
	 * Returns true if the rss key, is valid. Validation first checks to see if the database contains the bcrypted hash of the key.
	 * If the hash is not in the database, or the hash does not match the database value, and this authentication attempt is not too recent
	 *  (> 1 min since the previous attempt), then a connection to nationstates is opened to verify the rss key.
	 *  If the rss key is confirmed valid, a bcrypted-hash of the key is stored in the database to avoid unnecessary future nationstates calls.
	 *  <p>
	 *  If the authentication is not valid, a failure reason will be available from getFailureReason
	 * 
	 * @return if the authenticaton is valid
	 */
	public boolean isValid() {
		String hash = getHashFromDatabase();
		if (hash != null) {
			//If the hash check fails with the database value, it may be because the user revoked and regenerated the feed, can't assume they are invalid
			if (BCrypt.checkpw(String.valueOf(rssKey), hash)) {
				return true;
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
		hash = BCrypt.hashpw(String.valueOf(rssKey), BCrypt.gensalt(getNumLogRounds()));
		updateDatabaseHash(hash);
		return true;
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

	/**
	 * Controls how many bcrypt rounds are used in hashing the rss key. It increases the number of rounds over time, to account for Moore's Law.
	 * 
	 * @return number of bcrypt encryption rounds.
	 */
	private static int getNumLogRounds() {
		//Keep up with Moore's law, surrounded with Math.max in case server time is reset, to prevent changing the time from weakening
		int rounds = 14 + Math.max(0, ((new DateTime()).getYear() - 2014));
		return Math.min(31, rounds);
	}

	private void updateDatabaseHash(String hash) {
		access.generateAuthToken(nationId, true, hash);
	}

	private String getHashFromDatabase() {
		try (Connection conn = access.getPool().getConnection()) {
			try (PreparedStatement select = conn.prepareStatement("SELECT rss_hash FROM assembly.nation_auth WHERE nation_id = ?")) {
				select.setInt(1, nationId);
				try (ResultSet result = select.executeQuery()) {
					if (result.next()) {
						String hash = result.getString(1);
						if (!result.wasNull()) {
							return hash;
						}
					}
				}
			}
		} catch (SQLException e) {
			Logger.error("SQLException retreiving SQL rss hash", e);
		}
		return null;
	}

	private static final Cache<Integer, Boolean> LAST_RSS_AUTHENTICATION_ATTEMPT = CacheBuilder.newBuilder().expireAfterWrite(1, TimeUnit.MINUTES).build();
}
