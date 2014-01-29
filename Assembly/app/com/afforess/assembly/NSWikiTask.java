package com.afforess.assembly;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;

import net.sourceforge.jwbf.core.contentRep.Article;
import net.sourceforge.jwbf.mediawiki.bots.MediaWikiBot;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.lang.WordUtils;
import org.joda.time.Duration;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.Logger;

import com.afforess.assembly.model.RegionalStats;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.mchange.v2.c3p0.ComboPooledDataSource;

public class NSWikiTask implements Runnable {
	private final DatabaseAccess access;
	private final String botUser;
	private final String botPassword;
	public NSWikiTask(DatabaseAccess access, YamlConfiguration config) {
		this.access = access;
		ConfigurationNode nswiki = config.getChild("nswiki");
		botUser = nswiki.getChild("wiki-bot").getString(null);
		botPassword = nswiki.getChild("wiki-bot-password").getString(null);
	}

	private void createRegionPage(String region, MediaWikiBot wikibot) {
		Article article = wikibot.getArticle("Region/" + region);
		article.setText(getRegionTemplate(wikibot));
		article.setTitle("Region/" + region);
		article.setEditor("NS-BOT");
		article.save("Create initial region page");
	}

	private String getRegionTemplate(MediaWikiBot wikibot) {
		return wikibot.getArticle("Blank Region").getText();
	}

	private static boolean doesNSWikiRegionExist(String region) throws IOException {
		URL userPage = new URL("http://nswiki.org/index.php?title=Region/" + URLEncoder.encode(region, "UTF-8"));
		HttpURLConnection conn = (HttpURLConnection) userPage.openConnection();
		conn.connect();
		return conn.getResponseCode() / 100 == 2;
	}

	private void updateRegionPage(String region) throws IOException, SQLException {
		MediaWikiBot wikibot = new MediaWikiBot("http://nswiki.org/");
		wikibot.login(botUser, botPassword);
		if (!doesNSWikiRegionExist(region)) {
			createRegionPage(region, wikibot);
		}
		
		Article article = wikibot.getArticle("Region/" + region);
		String text = article.getText();
		final String origText = text;
		
		RegionalStats stats = new RegionalStats(region);
		stats.updateStats(access);

		text = updateRegionVariable(text, "FLAG", stats.getFlag());
		text = updateRegionVariable(text, "FOUNDER", stats.getFounder());
		text = updateRegionVariable(text, "DELEGATE", stats.getDelegate());
		text = updateRegionVariable(text, "WA_POPULATION", stats.getNumWaMembers());
		text = updateRegionVariable(text, "POPULATION", stats.getNumNations());
		text = updateRegionVariable(text, "LINK", "[http://www.nationstates.net/region=" + stats.getName().toLowerCase().replaceAll(" ", "_") + " " + stats.getName() + "]");
		text = updateRegionVariable(text, "POPULATION_AMT", stats.getTotalPopulationDescription());
		text = updateRegionVariable(text, "POPULATION_AMT_YEAR", "2014");
		text = updateRegionVariable(text, "POPULATION_DESC", stats.getNumNationsDescription());
		text = updateRegionVariable(text, "HDI", String.format("%.3f", stats.getHumanDevelopmentIndex() / 100F));
		text = updateRegionVariable(text, "GRP", "N/A");
		text = updateRegionVariable(text, "STYLE", stats.getRegionDescription());
		
		text = updateRegionVariable(text, "NAME", WordUtils.capitalize(stats.getTitle()));
		
		if (!text.equals(origText)) {
			article.setText(text);
			article.setTitle("Region/" + region);
			article.setEditor("NS-BOT");
			article.save("Updated stats from latest NationStates data.");
		}
	}

	private static String updateRegionVariable(String text, String variable, int replacement) {
		return updateRegionVariable(text, variable, String.valueOf(replacement));
	}

	private static String updateRegionVariable(String text, String variable, String replacement) {
		final String variableStart = (new StringBuilder("<!--REGION_").append(variable).append("_START-->")).toString();
		final String variableEnd = (new StringBuilder("<!--REGION_").append(variable).append("_END-->")).toString();
		int index = text.indexOf(variableStart);
		while(index > -1) {
			int endIndex = text.indexOf(variableEnd, index + variableStart.length());
			if (endIndex != -1) {
				text = (new StringBuilder(text.substring(0, index + variableStart.length())).append(replacement).append(text.substring(endIndex))).toString();
				index = text.indexOf(variableStart, endIndex + variableEnd.length());
			} else {
				break;
			}
		}
		return text;
	}

	public static void main(String[] args) throws IOException, SQLException {
		YamlConfiguration config = Start.loadConfig();
		ComboPooledDataSource pool = Start.loadDatabase(config.getChild("settings"));
		DatabaseAccess access = new DatabaseAccess(pool, 100);
		NSWikiTask task = new NSWikiTask(access, config);
		task.updateRegionPage("Capitalist Paradise");
	}

	@Override
	public void run() {
		try {
			runInternal();
		} catch(Exception e) {
			Logger.error("Unable to update NSWiki pages", e);
		}
	}

	private void runInternal() throws SQLException, IOException {
		Logger.info("Starting NSWiki Update");
		ArrayList<String> regions = new ArrayList<String>();
		Connection conn = null;
		try {
			conn = access.getPool().getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT title FROM assembly.region WHERE last_wiki_update < ? ORDER BY last_wiki_update DESC LIMIT 0, 14");
			select.setInt(1, (int)((System.currentTimeMillis() - Duration.standardHours(24).getMillis()) / 1000L));
			ResultSet result = select.executeQuery();
			
			while(result.next()) {
				String region = result.getString(1);
				regions.add(region);
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);

			PreparedStatement update = conn.prepareStatement("UPDATE assembly.region SET last_wiki_update = ? WHERE name = ?");
			for (String region : regions) {
				update.setInt(1, (int)(System.currentTimeMillis() / 1000L));
				update.setString(2, Utils.sanitizeName(region));
				
				Logger.info("Updating NSWiki region page for [" + region + "]");
				updateRegionPage(region);
				
				update.executeUpdate();
			}
			DbUtils.closeQuietly(update);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Logger.info("Finished NSWiki Update");
	}
}
