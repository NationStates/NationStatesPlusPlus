package controllers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.lang3.text.WordUtils;

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

	public Result foundNewspaper(String region) throws SQLException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getCache());
		if (ret != null) {
			return ret;
		}
		String nation = Utils.getPostValue(request(), "nation");
		
		Map<String, Object> results = new HashMap<String, Object>(1);
		Utils.handleDefaultPostHeaders(request(), response());
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement newspaper = conn.prepareStatement("SELECT newspaper FROM assembly.newspapers WHERE region = ? AND disbanded = 0");
			newspaper.setString(1, region);
			ResultSet result = newspaper.executeQuery();
			if (result.next()) {
				return Results.forbidden();
			}
			
			PreparedStatement select = conn.prepareStatement("SELECT delegate, founder FROM assembly.region WHERE name = ?");
			select.setString(1, region);
			result = select.executeQuery();
			boolean regionAdministrator = true;
			if (result.next()) {
				if (!nation.equals(result.getString(1)) && !nation.equals(result.getString(2))) {
					regionAdministrator = false;
				}
			} else {
				regionAdministrator = false;
			}
			if (!regionAdministrator) {
				return Results.unauthorized();
			}
			
			newspaper = conn.prepareStatement("INSERT INTO assembly.newspapers (region, editor, title, byline) VALUES (?, ?, ?, ?)");
			newspaper.setString(1, region);
			newspaper.setString(2, nation);
			newspaper.setString(3, WordUtils.capitalize(region.replaceAll("_", " ")) + " Regional News");
			newspaper.setString(4, WordUtils.capitalize(nation.replaceAll("_", " ")) + " makes the trains run on time!");
			newspaper.executeUpdate();
			
			newspaper = conn.prepareStatement("SELECT newspaper FROM assembly.newspapers WHERE disbanded = 0 AND region = ?");
			newspaper.setString(1, region);
			result = newspaper.executeQuery();
			result.next();
			final int newspaperId = result.getInt(1);
			results.put("newspaper_id", newspaperId);
			
			PreparedStatement editors = conn.prepareStatement("INSERT INTO assembly.newspaper_editors (newspaper, nation_id) VALUES (?, ?)");
			editors.setInt(1, newspaperId);
			editors.setInt(2, getCache().getNationId(nation));
			editors.executeUpdate();
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return Results.ok(Json.toJson(results)).as("application/json");
	}

	public Result disbandNewspaper(String region) throws SQLException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getCache());
		if (ret != null) {
			return ret;
		}
		String nation = Utils.getPostValue(request(), "nation");
		
		Utils.handleDefaultPostHeaders(request(), response());
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement newspaper = conn.prepareStatement("SELECT newspaper FROM assembly.newspapers WHERE region = ? AND disbanded = 0");
			newspaper.setString(1, region);
			ResultSet result = newspaper.executeQuery();
			if (!result.next()) {
				return Results.forbidden();
			}
			
			PreparedStatement select = conn.prepareStatement("SELECT delegate, founder FROM assembly.region WHERE name = ?");
			select.setString(1, region);
			result = select.executeQuery();
			boolean regionAdministrator = true;
			if (result.next()) {
				if (!nation.equals(result.getString(1)) && !nation.equals(result.getString(2))) {
					regionAdministrator = false;
				}
			} else {
				regionAdministrator = false;
			}
			if (!regionAdministrator) {
				return Results.unauthorized();
			}
			
			newspaper = conn.prepareStatement("UPDATE assembly.newspapers SET disbanded = 1 WHERE region = ?");
			newspaper.setString(1, region);
			newspaper.executeUpdate();
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return Results.ok();
	}

	public Result findNewspaper(String region) throws SQLException {
		Map<String, Object> newspaper = new HashMap<String, Object>();
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement articles = conn.prepareStatement("SELECT newspaper FROM assembly.newspapers WHERE disbanded = 0 AND region = ?");
			articles.setString(1, region);
			ResultSet result = articles.executeQuery();
			if (result.next()) {
				newspaper.put("newspaper_id", result.getInt(1));
			} else {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.notFound();
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(newspaper.hashCode()), "60");
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(newspaper)).as("application/json");
	}

	public Result getLatestUpdate(int id) throws SQLException {
		Map<String, Object> newspaper = new HashMap<String, Object>();
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement articles = conn.prepareStatement("SELECT max(articles.timestamp) FROM assembly.articles WHERE newspaper_id = ? AND visible = 1");
			articles.setInt(1, id);
			ResultSet result = articles.executeQuery();
			if (result.next()) {
				newspaper.put("timestamp", result.getLong(1));
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		newspaper.put("newspaper_id", id);

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(newspaper.hashCode()), "0");
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(newspaper)).as("application/json");
	}

	public Result getNewspaperDetails(int id) throws SQLException {
		Map<String, Object> newspaper = new HashMap<String, Object>();
		Connection conn = null;
		try {
			conn = getConnection();

			PreparedStatement select = conn.prepareStatement("SELECT title, byline, editor, region FROM assembly.newspapers WHERE newspaper = ? ");
			select.setInt(1, id);
			ResultSet result = select.executeQuery();
			if (result.next()) {
				newspaper.put("newspaper_id", id);
				newspaper.put("newspaper", result.getString(1));
				newspaper.put("byline", result.getString(2));
				newspaper.put("editor", result.getString(3));
				newspaper.put("region", result.getString(4));
			}
			PreparedStatement editors = conn.prepareStatement("SELECT n.name, n.formatted_name FROM assembly.newspaper_editors AS e LEFT OUTER JOIN assembly.nation AS n ON n.id = e.nation_id WHERE newspaper = ?");
			editors.setInt(1, id);
			ResultSet set = editors.executeQuery();
			ArrayList<Map<String, String>> editorNations = new ArrayList<Map<String, String>>();
			while(set.next()) {
				Map<String, String> nation = new HashMap<String, String>(2);
				nation.put("name", set.getString(1));
				nation.put("formatted_name", set.getString(2));
				editorNations.add(nation);
			}
			newspaper.put("editors", editorNations);
		} finally {
			DbUtils.closeQuietly(conn);
		}
		newspaper.put("newspaper_id", id);

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(newspaper.hashCode()), "0");
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(newspaper)).as("application/json");
	}

	public Result getNewspaper(int id, boolean visible, boolean hideBody) throws SQLException {
		Map<String, Object> newspaper = new HashMap<String, Object>();
		ArrayList<Map<String, String>> news = new ArrayList<Map<String, String>>();
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement articles = conn.prepareStatement("SELECT article_id, article, title, articles.timestamp, author, articles.column, articles.order, visible FROM assembly.articles WHERE newspaper_id = ? " + (visible ? "AND visible = 1" : ""));
			articles.setInt(1, id);
			ResultSet result = articles.executeQuery();
			while(result.next()) {
				Map<String, String> article = new HashMap<String, String>();
				article.put("article_id", String.valueOf(result.getInt(1)));
				if (!hideBody) {
					article.put("article", result.getString(2));
				}
				article.put("title", result.getString(3));
				article.put("timestamp", String.valueOf(result.getLong(4)));
				article.put("author", result.getString(5));
				article.put("column", result.getString(6));
				article.put("order", result.getString(7));
				article.put("newspaper", String.valueOf(id));
				article.put("visible", String.valueOf(result.getByte(8)));
				news.add(article);
			}
			
			PreparedStatement select = conn.prepareStatement("SELECT title, byline, editor FROM assembly.newspapers WHERE newspaper = ? ");
			select.setInt(1, id);
			result = select.executeQuery();
			result.next();
			newspaper.put("newspaper_id", id);
			newspaper.put("newspaper", result.getString(1));
			newspaper.put("byline", result.getString(2));
			newspaper.put("editor", result.getString(3));
		} finally {
			DbUtils.closeQuietly(conn);
		}
		newspaper.put("articles", news);
		newspaper.put("newspaper_id", id);

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(newspaper.hashCode()), "0");
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(newspaper)).as("application/json");
	}

	public Result changeEditors(int newspaper) throws SQLException {
		Result result = canEditImpl(newspaper);
		if (result != null) {
			return result;
		}
		String add = Utils.getPostValue(request(), "add");
		String remove = Utils.getPostValue(request(), "remove");
		String submitter = Utils.getPostValue(request(), "nation");
		
		Connection conn = null;
		try {
			conn = getConnection();
			
			String editor = null;
			PreparedStatement select = conn.prepareStatement("SELECT editor FROM assembly.newspapers WHERE newspaper = ? ");
			select.setInt(1, newspaper);
			ResultSet set = select.executeQuery();
			if (set.next()) {
				editor = set.getString(1);
			} else {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.badRequest();
			}
			
			if (!editor.equals(submitter)) {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.unauthorized();
			}
			
			Set<Integer> existingEditors = new HashSet<Integer>();
			select = conn.prepareStatement("SELECT nation_id FROM assembly.newspaper_editors WHERE newspaper = ?");
			select.setInt(1, newspaper);
			set = select.executeQuery();
			while(set.next()) {
				existingEditors.add(set.getInt(1));
			}
			
			Map<String, String> errors = new HashMap<String, String>();
			conn.setAutoCommit(false);
			Savepoint save = conn.setSavepoint(String.valueOf(System.currentTimeMillis()));
			if (add != null) {
				for (String nation : add.split(",")) {
					final String format = nation.toLowerCase().replaceAll(" ", "_");
					final int nationId = getCache().getNationId(format);
					if (nationId > -1) {
						if (!existingEditors.contains(nationId)) {
							PreparedStatement editors = conn.prepareStatement("INSERT INTO assembly.newspaper_editors (newspaper, nation_id) VALUES (?, ?)");
							editors.setInt(1, newspaper);
							editors.setInt(2, nationId);
							editors.executeUpdate();
						}
					} else {
						errors.put("error", "unknown nation: " + nation);
						conn.rollback(save);
						Utils.handleDefaultPostHeaders(request(), response());
						return Results.ok(Json.toJson(errors)).as("application/json");
					}
				}
			}
			if (remove != null) {
				for (String nation : remove.split(",")) {
					final String format = nation.toLowerCase().replaceAll(" ", "_");
					if (format.equals(editor)) {
						errors.put("error", "Cannot remove Editor-in-Chief");
						conn.rollback(save);
						Utils.handleDefaultPostHeaders(request(), response());
						return Results.ok(Json.toJson(errors)).as("application/json");
					}
					final int nationId = getCache().getNationId(format);
					if (nationId > -1) {
						if (existingEditors.contains(nationId)) {
							PreparedStatement editors = conn.prepareStatement("DELETE FROM assembly.newspaper_editors WHERE newspaper = ? AND nation_id = ?");
							editors.setInt(1, newspaper);
							editors.setInt(2, nationId);
							editors.executeUpdate();
						}
					} else {
						errors.put("error", "unknown nation: " + nation);
						conn.rollback(save);
						Utils.handleDefaultPostHeaders(request(), response());
						return Results.ok(Json.toJson(errors)).as("application/json");
					}
				}
			}
			conn.commit();
		} finally {
			if (conn != null) {
				conn.setAutoCommit(true);
			}
			DbUtils.closeQuietly(conn);
		}
		Utils.handleDefaultPostHeaders(request(), response());
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
				Utils.handleDefaultPostHeaders(request(), response());
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
		Utils.handleDefaultPostHeaders(request(), response());
		return Results.ok();
	}

	public Result administrateNewspaper(int newspaper) throws SQLException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getCache());
		if (result != null) {
			return result;
		}
		String nation = Utils.getPostValue(request(), "nation");
		String title = Utils.getPostValue(request(), "title");
		String byline = Utils.getPostValue(request(), "byline");
		if (title == null || title.length() > 255 || byline == null || byline.length() > 255) {
			Utils.handleDefaultPostHeaders(request(), response());
			return Results.badRequest();
		}
		Connection conn = null;
		try {
			conn = getConnection();
			
			PreparedStatement editors = conn.prepareStatement("SELECT editor FROM assembly.newspapers WHERE newspaper = ?");
			editors.setInt(1, newspaper);
			ResultSet set = editors.executeQuery();
			boolean validEditor = false;
			if (set.next()) {
				if (set.getString(1).equals(nation)) {
					validEditor = true;
				}
			}
			
			if (!validEditor) {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.unauthorized();
			}
			
			PreparedStatement update = conn.prepareStatement("UPDATE assembly.newspapers SET title = ?, byline = ? WHERE newspaper = ?");
			update.setString(1, title);
			update.setString(2, byline);
			update.setInt(3, newspaper);
			update.executeUpdate();
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Utils.handleDefaultPostHeaders(request(), response());
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
			Utils.handleDefaultPostHeaders(request(), response());
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
				Utils.handleDefaultPostHeaders(request(), response());
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
		Utils.handleDefaultPostHeaders(request(), response());
		return Results.ok();
	}
}
