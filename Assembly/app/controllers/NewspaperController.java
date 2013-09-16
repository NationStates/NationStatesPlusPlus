package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.dbutils.DbUtils;

import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

import com.afforess.assembly.util.NationCache;
import com.afforess.assembly.util.RegionCache;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;
import com.mchange.v2.c3p0.ComboPooledDataSource;

public class NewspaperController extends NationStatesController {
	public NewspaperController(ComboPooledDataSource pool, NationCache cache, RegionCache regionCache, NationStates api) {
		super(pool, cache, regionCache, api);
	}

	public Result findNewspaper(String region) throws SQLException {
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement articles = conn.prepareStatement("SELECT newspaper FROM assembly.newspapers WHERE region = ?");
			articles.setString(1, region);
			ResultSet result = articles.executeQuery();
			if (result.next()) {
				return getNewspaper(result.getInt(1));
			}
			 Utils.handleDefaultHeaders(request(), response(), null);
			return Results.notFound();
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}

	public Result getNewspaper(int id) throws SQLException {
		ArrayList<Map<String, String>> news = new ArrayList<Map<String, String>>();
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement articles = conn.prepareStatement("SELECT article_id, article, title, articles.timestamp, author, articles.column, articles.order FROM assembly.articles WHERE newspaper_id = ? AND visible = 1");
			articles.setInt(1, id);
			ResultSet result = articles.executeQuery();
			while(result.next()) {
				Map<String, String> article = new HashMap<String, String>();
				article.put("article_id", String.valueOf(result.getInt(1)));
				article.put("article", result.getString(2));
				article.put("title", result.getString(3));
				article.put("timestamp", String.valueOf(result.getLong(4)));
				article.put("author", result.getString(5));
				article.put("column", result.getString(6));
				article.put("order", result.getString(7));
				news.add(article);
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}

		Result result = Utils.handleDefaultHeaders(request(), response(), String.valueOf(news.hashCode()));
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(news)).as("application/json");
	}

	public Result changeEditors(int newspaper) throws SQLException {
		Result result = canEditImpl(newspaper);
		if (result != null) {
			return result;
		}
		String add = Utils.getPostValue(request(), "add");
		String remove = Utils.getPostValue(request(), "remove");
		
		Connection conn = null;
		try {
			conn = getConnection();
			if (add != null) {
				for (String nation : add.split(",")) {
					PreparedStatement editors = conn.prepareStatement("INSERT INTO assembly.newspaper_editors (newspaper, nation_id) VALUES (?, ?)");
					editors.setInt(1, newspaper);
					editors.setInt(2, getCache().getNationId(nation.toLowerCase().replaceAll(" ", "_")));
					editors.executeUpdate();
				}
			}
			if (remove != null) {
				for (String nation : remove.split(",")) {
					PreparedStatement editors = conn.prepareStatement("DELETE FROM assembly.newspaper_editors WHERE newspaper = ? AND nation_id = ?");
					editors.setInt(1, newspaper);
					editors.setInt(2, getCache().getNationId(nation.toLowerCase().replaceAll(" ", "_")));
					editors.executeUpdate();
				}
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Utils.handleDefaultHeaders(request(), response(), null, "0");
		return Results.ok();
	}

	private Result canEditImpl(int newspaper) throws SQLException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getCache());
		if (result != null) {
			return result;
		}
		String nation = Utils.getPostValue(request(), "nation");
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement editors = conn.prepareStatement("SELECT nation_id FROM assembly.newspaper_editors WHERE newspaper = ?");
			editors.setInt(1, newspaper);
			ResultSet set = editors.executeQuery();
			final int nationId = getCache().getNationId(nation);
			boolean validEditor = false;
			while (set.next()) {
				if (set.getInt(1) == nationId) {
					validEditor = true;
					break;
				}
			}
			
			if (!validEditor) {
				Utils.handleDefaultHeaders(request(), response(), null, "0");
				return Results.unauthorized();
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return null;
	}

	public Result canEdit(int newspaper) throws SQLException {
		Result result = canEditImpl(newspaper);
		if (result != null) {
			return result;
		}
		Utils.handleDefaultHeaders(request(), response(), null, "0");
		return Results.ok();
	}

	public Result submitArticle(int newspaper, int articleId) throws SQLException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getCache());
		if (result != null) {
			return result;
		}
		String article = Utils.getPostValue(request(), "article");
		String title = Utils.getPostValue(request(), "title");
		String timestamp = Utils.getPostValue(request(), "timestamp");
		String author = Utils.getPostValue(request(), "author");
		String column = Utils.getPostValue(request(), "column");
		String order = Utils.getPostValue(request(), "order");
		String visible = Utils.getPostValue(request(), "visible");
		String nation = Utils.getPostValue(request(), "nation");
		if (article == null || title == null || timestamp == null || author == null || column == null || order == null || newspaper == -1) {
			Utils.handleDefaultHeaders(request(), response(), null, "0");
			return Results.badRequest();
		}
		Connection conn = null;
		try {
			conn = getConnection();
			
			PreparedStatement editors = conn.prepareStatement("SELECT nation_id FROM assembly.newspaper_editors WHERE newspaper = ?");
			editors.setInt(1, newspaper);
			ResultSet set = editors.executeQuery();
			final int nationId = getCache().getNationId(nation);
			boolean validEditor = false;
			while (set.next()) {
				if (set.getInt(1) == nationId) {
					validEditor = true;
					break;
				}
			}
			
			if (!validEditor) {
				Utils.handleDefaultHeaders(request(), response(), null, "0");
				return Results.unauthorized();
			}
			
			if (articleId == -1) {
				PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.articles (newspaper_id, article, title, articles.timestamp, author, articles.column, articles.order, visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
				insert.setInt(1, newspaper);
				insert.setString(2, article);
				insert.setString(3, title);
				insert.setLong(4, Long.parseLong(timestamp));
				insert.setString(5, author);
				insert.setInt(6, Integer.parseInt(column));
				insert.setInt(7, Integer.parseInt(order));
				insert.setInt(8, Integer.parseInt(visible));
				insert.executeUpdate();
			} else {
				PreparedStatement insert = conn.prepareStatement("UPDATE assembly.articles SET article = ?, title = ?, articles.timestamp = ?, author = ?, articles.column = ?, articles.order = ?, visible = ? WHERE article_id = ?");
				insert.setString(1, article);
				insert.setString(2, title);
				insert.setLong(3, Long.parseLong(timestamp));
				insert.setString(4, author);
				insert.setInt(5, Integer.parseInt(column));
				insert.setInt(6, Integer.parseInt(order));
				insert.setInt(7, Integer.parseInt(visible));
				insert.setInt(8, articleId);
				insert.executeUpdate();
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Utils.handleDefaultHeaders(request(), response(), null, "0");
		return Results.ok();
	}
}
