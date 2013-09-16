package com.afforess.assembly;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.HttpURLConnection;
import java.net.URL;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.io.IOUtils;
import org.codehaus.jackson.annotate.JsonProperty;
import org.codehaus.jackson.map.ObjectMapper;
import org.joda.time.Duration;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import play.Logger;

import com.afforess.assembly.model.Nation;
import com.afforess.assembly.util.MultiPartFormOutputStream;
import com.afforess.assembly.util.NationCache;
import com.afforess.assembly.util.RegionCache;
import com.afforess.assembly.util.Sha;
import com.afforess.nsdump.NationsDump;
import com.mchange.v2.c3p0.ComboPooledDataSource;

public class Prism extends Thread {
	private final ComboPooledDataSource pool;
	private NationCache cache;
	private final RegionCache regionCache;
	private NationsDump dump;
	private boolean first = true;
	private boolean fullRun = false;
	private final Set<Nation> additionalNations = new HashSet<Nation>();
	private final String nation;
	private final String password;
	private final DailyDumps dumps;
	private File lastDumpFile = null;
	public Prism(ComboPooledDataSource pool, NationCache cache, RegionCache regionCache, String nation, String password, DailyDumps dumps) {
		this.pool = pool;
		this.cache = cache;
		this.regionCache = regionCache;
		this.nation = nation;
		this.password = password;
		this.dumps = dumps;
	}

	public final Connection getConnection() throws SQLException {
		return pool.getConnection();
	}

	public final NationCache getCache() {
		return cache;
	}

	public final RegionCache getRegionCache() {
		return regionCache;
	}

	@Override
	public void run() {
		try {
			Thread.sleep(60000L);
		} catch (InterruptedException e) {
			return;
		}
		Logger.info("Prism task initializing, using nation [" + nation + "], with password [" + Sha.hash256(password) + "]");
		while(!this.isInterrupted()) {
			try {
				Thread.sleep(30000L);
			} catch (InterruptedException e) {
				return;
			}
			updateHappenings();
		}
	}

	private static class NationJson {
		@JsonProperty
		private Nation[] nations;
	}

	public void updateHappenings() {
		try {
			if (lastDumpFile == null || !lastDumpFile.getName().equals(dumps.getMostRecentNationDump().getName())) {
				try {
					lastDumpFile = dumps.getMostRecentNationDump();
					dump = new NationsDump(lastDumpFile);
					dump.parse();
					additionalNations.clear();
				} catch (Exception e) {
					dump = null;
					lastDumpFile = null;
					Logger.error("Unable to parse nation dump", e);
				}
			}
			List<String> dossiers = new ArrayList<String>();
			StringBuilder dossier = new StringBuilder();
			int total = 0;
			Map<String, String> regions = new HashMap<String, String>(100000);
			@SuppressWarnings("unchecked")
			Set<String> allNations = (Set<String>) (first ? new HashSet<String>(100000) : Collections.emptySet());
			
			Connection conn = dump.getDatabaseConnection();
			ResultSet result = null;
			try {
				PreparedStatement statement = conn.prepareStatement("SELECT name, region FROM nations");
				result = statement.executeQuery();

				while(result.next()) {
					String name = result.getString(1);
					String region = result.getString(2);
					dossier.append(name).append("\n");
					regions.put(name, region);
					if (first) {
						allNations.add(name);
					}
					total++;
					if (total % 2500 == 0) {
						dossiers.add(dossier.toString());
						dossier = new StringBuilder();
					}
				}
			} finally {
				DbUtils.closeQuietly(result);
				DbUtils.closeQuietly(conn);
				conn = null;
			}
			
			try {
				ObjectMapper mapper = new ObjectMapper();
				List<Nation> newNations = Arrays.asList(mapper.readValue(new URL("http://nationstatespostmaster.com/api/world/").openStream(), NationJson.class).nations);
				additionalNations.addAll(newNations);
			} catch (Exception e) {
				Logger.error("Unable to fetch new nations");
			}
			int added = 0;
			for (Nation n : additionalNations) {
				if ("new".equals(n.status)) {
					dossier.append(n.name).append("\n");
					regions.put(n.name, n.region);
					total++;
					added++;
					if (total % 2500 == 0) {
						dossiers.add(dossier.toString());
						dossier = new StringBuilder();
					}
				}
			}
			Logger.info("Added an additional " + added + " new nations to the list");

			dossiers.add(dossier.toString());

			//Warm up the cache
			if (first) {
				conn = getConnection();
				try {
					PreparedStatement statement = conn.prepareStatement("SELECT id, name, flag, wa_member FROM assembly.nation");
					result = statement.executeQuery();
					while(result.next()) {
						int id = result.getInt(1);
						String name = result.getString(2);
						String flag = result.getString(3);
						byte waMember = result.getByte(4);
						getCache().updateCache(name, flag, waMember == 1, id);
						allNations.remove(name);
					}
					for (String nation : allNations) {
						getCache().updateCache(nation, null, null, -1);
					}
				} finally {
					DbUtils.closeQuietly(conn);
					conn = null;
				}
				allNations.clear();
			}
			allNations = null;
	
			login();
			clearIssues();
			for (int i = 0; i < dossiers.size(); i++) {
				final long start = System.currentTimeMillis();
				final String nations = dossiers.get(i);
				clearDossier();
				Thread.sleep(2500);
				uploadDossier(nations);
				Thread.sleep(2500);
				Logger.info("Updating Reports for Batch - " + (i + 1) + " of " + (dossiers.size()));
				final long time = System.currentTimeMillis();
				
				Document doc = Jsoup.parse(sendPostData("http://www.nationstates.net/page=reports", "report_hours=" + (fullRun ? "9999999999999999999999999" : "2") + "&report_dossier=1&generate_report=Generate+Report"));
				final Element ul = doc.select("h2").get(0).nextElementSibling();
				if (ul == null) {
					Logger.error("Dossier is empty!");
					Logger.error("Empty Dossier: " + doc.html());
				} else {
					Logger.info("Report parsing took " + (System.currentTimeMillis() - time) + " ms");
					final long now = System.currentTimeMillis();
	
					Connection assembly = getConnection();
					try {
						PreparedStatement batchInsert = assembly.prepareStatement("INSERT INTO assembly.global_happenings (nation, happening, timestamp) VALUES (?, ?, ?)");
						for (int j = ul.children().size() - 1; j >= 0; j--) {
							Element li = ul.children().get(j);
							try {
								parseHappening(assembly, batchInsert, li, regions);
							} catch (Exception e) {
								Logger.error("Unable to parse happening! [ " + li.html() + " ]", e);
							}
						}
						batchInsert.executeBatch();
		
						setLastUpdate(assembly, nations, now);
					} finally {
						DbUtils.closeQuietly(assembly);
					}
					
					Logger.info("Report update took " + (System.currentTimeMillis() - now) + " ms");
				}
				
				Thread.sleep(Math.max(1L, 10000L - (System.currentTimeMillis() - start)));
			}
			first = false;
			fullRun = false;
		} catch (Exception e) {
			Logger.error("Unable to update happenings", e);
		}
	}

	private long getLastUpdate(Connection conn, String nation) throws SQLException {
		PreparedStatement selectUpdate = null;
		ResultSet result = null;
		try {
			selectUpdate = conn.prepareStatement("SELECT last_happening_run FROM assembly.nation WHERE name = ?");
			selectUpdate.setString(1, nation);
			result = selectUpdate.executeQuery();
			if (result.next()) {
				return result.getLong(1);
			}
			return 0L;
		} finally {
			DbUtils.closeQuietly(selectUpdate);
			DbUtils.closeQuietly(result);
		}
	}

	private void setLastUpdate(Connection conn, String nations, long timestamp) throws SQLException{
		PreparedStatement update = null;
		try {
			update = conn.prepareStatement("UPDATE assembly.nation SET last_happening_run = ? WHERE name = ?");
			for (String nation : nations.split("\n")) {
				update.setLong(1, timestamp);
				update.setString(2, nation.trim());
				update.addBatch();
			}
			update.executeBatch();
		} finally {
			DbUtils.closeQuietly(update);
		}
	}

	private void updateNation(Connection conn, String nation, String fullName, String flag, String region, boolean overwriteFullname) throws SQLException {
		int id = getCache().getNationId(nation);
		PreparedStatement insert = null;
		ResultSet keys = null;
		try {
			if (id == -1) {
				insert = conn.prepareStatement("INSERT INTO assembly.nation (name, formatted_name, flag, region, needs_update) VALUES (?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
				insert.setString(1, nation);
				insert.setString(2, fullName);
				insert.setString(3, flag);
				insert.setString(4, region);
				insert.setByte(5, (byte) 1);
				
				insert.executeUpdate();
				keys = insert.getGeneratedKeys();
				keys.next();
				id = keys.getInt(1);
				getCache().updateCache(nation, flag, null, id);
			} else {
				insert = conn.prepareStatement("UPDATE assembly.nation SET name = ?, " + (overwriteFullname ? "formatted_name = ?, " : "") + "flag = ? WHERE id = ?");
				int index = 1;
				insert.setString(index, nation); index++;
				if (overwriteFullname) {
					insert.setString(index, fullName); index++;
				}
				insert.setString(index, flag); index++;
				insert.setInt(index, id); index++;
				insert.executeUpdate();
				getCache().updateCache(nation, flag, null, id);
			}
		} finally {
			DbUtils.closeQuietly(insert);
			DbUtils.closeQuietly(keys);
		}
	}

	private void parseHappening(Connection conn, PreparedStatement insert, Element li, Map<String, String> regions) throws SQLException {
		String text = li.text().replaceAll("&quot;", "\"");
		String time = text.split(":")[0].toLowerCase();
		text = text.substring(time.length() + 2);
		long now = System.currentTimeMillis();
		long timestamp;
		if (time.contains("seconds ago")) {
			timestamp = now;
		} else if (time.contains("minutes ago")) {
			timestamp = now - Duration.standardMinutes(Integer.parseInt(time.split(" ")[0])).getMillis();
		} else if (time.contains("minute ago")) {
			timestamp = now - Duration.standardMinutes(1).getMillis();
		} else if (time.contains("days") && time.contains("hours ago")) {
			timestamp = now - Duration.standardDays(Integer.parseInt(time.split(" ")[0])).getMillis() -  Duration.standardHours(Integer.parseInt(time.split(" ")[2])).getMillis();
		} else if (time.contains("days") && time.contains("hour ago")) {
			timestamp = now - Duration.standardDays(Integer.parseInt(time.split(" ")[0])).getMillis() -  Duration.standardHours(1).getMillis();
		} else if (time.contains("day") && time.contains("hours ago")) {
			timestamp = now - Duration.standardDays(1).getMillis() -  Duration.standardHours(Integer.parseInt(time.split(" ")[2])).getMillis();
		} else if (time.contains("day") && time.contains("hour ago")) {
			timestamp = now - Duration.standardDays(1).getMillis() -  Duration.standardHours(1).getMillis();
		} else if (time.contains("years") && time.contains("days ago")) {
			timestamp = now - Duration.standardDays(365 * Integer.parseInt(time.split(" ")[0]) + Integer.parseInt(time.split(" ")[2])).getMillis();
		} else if (time.contains("years") && time.contains("day ago")) {
			timestamp = now - Duration.standardDays(365 * Integer.parseInt(time.split(" ")[0]) + 1).getMillis();
		} else if (time.contains("year") && time.contains("days ago")) {
			timestamp = now - Duration.standardDays(365 + Integer.parseInt(time.split(" ")[2])).getMillis();
		} else if (time.contains("year") && time.contains("day ago")) {
			timestamp = now - Duration.standardDays(366).getMillis();
		} else if (time.contains("years ago")) {
			timestamp = now - Duration.standardDays(365 * Integer.parseInt(time.split(" ")[0])).getMillis();
		} else if (time.contains("days ago")) {
			timestamp = now - Duration.standardDays(Integer.parseInt(time.split(" ")[0])).getMillis();
		} else if (time.contains("hours ago")) {
			timestamp = now - Duration.standardHours(Integer.parseInt(time.split(" ")[0])).getMillis();
		} else if (time.contains("year ago")) {
			timestamp = now - Duration.standardDays(365).getMillis();
		} else if (time.contains("day ago")) {
			timestamp = now - Duration.standardDays(1).getMillis();
		} else {
			throw new IllegalStateException("Unable to parse timestamp [" + time + "]");
		}
		
		String happeningNation = null;
		boolean first = true;
		for (Element nlink : li.select(".nlink")) {
			String nation = nlink.attr("href").substring(7);
			String flag = nlink.select(".miniflag").get(0).attr("src");
			String fullName = nlink.select("span").get(0).text();
			
			if (first) {
				long lastUpdate = getLastUpdate(conn, nation);
				if (lastUpdate > timestamp) {
					return;
				}
				happeningNation = nation;
			}
			
			String region = regions.get(nation);
			region = (region != null ? region : "");
			updateNation(conn, nation, fullName, "http://www.nationstates.net/" + flag, region, !first);
			text = text.replaceAll(fullName, "@@" + nation + "@@");

			first = false;
		}
		
		for (Element rlink : li.select(".rlink")) {
			String region = rlink.attr("href").substring(7);
			if (region.endsWith("#rmb")) {
				text = text.replaceAll(rlink.text(), "##" + region.split("#")[0] + "##");
			} else {
				text = text.replaceAll(rlink.text(), "%%" + region + "%%");
			}
		}
		
		for (Element ahref : li.select("a")) {
			if (ahref.attr("href").contains("/page=rmb/postid=")) {
				text = text.replaceAll("a message", "<a href=\"" + ahref.attr("href") + "\">a message</a>");
				break;
			}
		}

		if (happeningNation == null) {
			throw new IllegalStateException("No nation identified for happening!");
		}

		insert.setString(1, happeningNation);
		insert.setString(2, text);
		insert.setLong(3, timestamp);
		insert.addBatch();
	}

	private void login() throws IOException {
		CookieManager cookieManager = new CookieManager();
		CookieHandler.setDefault(cookieManager);

		sendPostData("http://www.nationstates.net/page=login", "logging_in=1&nation=" + nation.toLowerCase() + "&password=" + password + "&autologin=yes");
	}

	private static String sendPostData(String URL, String data) throws IOException {
		URL url = new URL(URL);
		HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Ubuntu 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36");
		conn.setUseCaches(false);
		conn.setDoInput(true);
		conn.setDoOutput(true);
		conn.setRequestMethod("POST");
		OutputStream output = conn.getOutputStream();
		output.write(data.getBytes("UTF-8"));
		output.flush();
		String result = IOUtils.toString(conn.getInputStream());
		Logger.debug("Post result for [" + URL + "], with result: " + result);
		IOUtils.closeQuietly(conn.getInputStream());
		IOUtils.closeQuietly(output);
		conn.disconnect();
		return result;
	}

	private static void clearIssues() throws IOException {
		Logger.debug("Clearing issues");
		sendPostData("http://www.nationstates.net/page=dilemmas", "dismiss_all=1");
	}

	private static void clearDossier() throws IOException {
		Logger.debug("Clearing dossier");
		sendPostData("http://www.nationstates.net/page=dossier", "clear_dossier=REMOVE+ALL");
	}

	private static String getLocalId() throws IOException {
		URL url = new URL("http://www.nationstates.net/page=dossier_advanced");
		HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Ubuntu 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36");
		conn.setUseCaches(false);
		conn.setDoInput(true);
		conn.setDoOutput(true);
		Document doc = Jsoup.parse(IOUtils.toString(conn.getInputStream()));
		conn.disconnect();
		return doc.select("input[name=localid]").get(0).attr("value");
	}

	private void uploadDossier(String nations) throws IOException {
		final String localid = getLocalId();
		Logger.debug("Uploading dossier for [" + nation + "] with localid: " + localid );
		URL url = new URL("http://www.nationstates.net/cgi-bin/dossier.cgi");
		HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Ubuntu 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36");
		conn.setRequestProperty("Content-Type", "multipart/form-data");
		conn.setUseCaches(false);
		conn.setDoInput(true);
		conn.setDoOutput(true);
		conn.setRequestMethod("POST");
		MultiPartFormOutputStream output = new MultiPartFormOutputStream(conn.getOutputStream(), MultiPartFormOutputStream.createBoundary());
		output.writeField("nationname", nation.toLowerCase().trim());
		output.writeField("localid", localid);
		output.writeFile("file", "text/plain", "dossier.txt", nations.getBytes("UTF-8"));
		output.writeField("action_append", "Upload Nation Dossier File");
		output.flush();
		output.close();
		Logger.debug("Finished dossier upload : " + IOUtils.toString(conn.getInputStream()));
		IOUtils.closeQuietly(conn.getInputStream());
		conn.disconnect();
		
	}
}
