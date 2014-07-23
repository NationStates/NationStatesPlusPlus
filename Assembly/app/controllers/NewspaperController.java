package controllers;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.dbutils.DbUtils;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.Logger;
import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

import com.afforess.assembly.model.Nation;
import com.afforess.assembly.model.websocket.PageType;
import com.afforess.assembly.model.websocket.RequestType;
import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.fasterxml.jackson.databind.JsonNode;
import com.limewoodMedia.nsapi.NationStates;

import static com.afforess.assembly.model.websocket.DataRequest.getBlankRequest;

public class NewspaperController extends NationStatesController {
	private final String imgurClientKey;
	public static final int GAMEPLAY_NEWS = 0;
	public static final int ROLEPLAY_NEWS = 1;

	public NewspaperController(DatabaseAccess access, YamlConfiguration config, NationStates api) {
		super(access, config, api);
		ConfigurationNode imgurAuth = getConfig().getChild("imgur");
		imgurClientKey = imgurAuth.getChild("client-key").getString(null);
	}

	public Result foundNewspaper(String region) throws SQLException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		final int regionId = getDatabase().getRegionId(region);

		Map<String, Object> results = new HashMap<String, Object>(1);
		Utils.handleDefaultPostHeaders(request(), response());
		try (Connection conn = getConnection()) {
			try (PreparedStatement newspaper = conn.prepareStatement("SELECT id FROM assembly.newspapers WHERE region = ? AND disbanded = 0")) {
				newspaper.setInt(1, regionId);
				try (ResultSet result = newspaper.executeQuery()) {
					if (result.next()) {
						return Results.forbidden();
					}
				}
			}

			try (PreparedStatement select = conn.prepareStatement("SELECT delegate, founder FROM assembly.region WHERE name = ?")) {
				select.setString(1, region);
				try (ResultSet result = select.executeQuery()) {
					boolean regionAdministrator = false;
					if (result.next()) {
						Logger.info("Attempting to found paper for " + region + ", nation: " + nation);
						Logger.info("Delegate: " + result.getString("delegate") + " | Founder: " + result.getString("founder"));
						if (nation.equals(result.getString("delegate")) || nation.equals(result.getString("founder"))) {
							regionAdministrator = true;
						}
					} else {
						Logger.info("Attempting to found paper for " + region + ", no region found!");
					}
					
					if (!regionAdministrator) {
						return Results.unauthorized("You are not a regional administrator");
					}
				}
			}
			final int newspaperId;
			try (PreparedStatement newspaper = conn.prepareStatement("INSERT INTO assembly.newspapers (region, editor, title, byline) VALUES (?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS)) {
				newspaper.setInt(1, regionId);
				newspaper.setString(2, nation);
				newspaper.setString(3, Utils.formatName(nation) + " Regional News");
				newspaper.setString(4, Utils.formatName(nation) + " makes the trains run on time!");
				newspaper.executeUpdate();
				ResultSet keys = newspaper.getGeneratedKeys();
				keys.next();
				newspaperId = keys.getInt(1);
			}

			results.put("newspaper_id", newspaperId);
			
			try (PreparedStatement editors = conn.prepareStatement("INSERT INTO assembly.newspaper_editors (newspaper, nation_id) VALUES (?, ?)")) {
				editors.setInt(1, newspaperId);
				editors.setInt(2, getDatabase().getNationId(nation));
				editors.executeUpdate();
			}
		}
		return Results.ok(Json.toJson(results)).as("application/json");
	}

	public Result disbandNewspaper(String region) throws SQLException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		final String nation = Utils.getPostValue(request(), "nation");
		final int regionId = getDatabase().getRegionId(region);
		
		Utils.handleDefaultPostHeaders(request(), response());
		try (Connection conn = getConnection()) {
			try (PreparedStatement newspaper = conn.prepareStatement("SELECT id FROM assembly.newspapers WHERE region = ? AND disbanded = 0")) {
				newspaper.setInt(1, regionId);
				try (ResultSet result = newspaper.executeQuery()) {
					if (!result.next()) {
						return Results.forbidden();
					}
				}
			}

			try (PreparedStatement select = conn.prepareStatement("SELECT delegate, founder FROM assembly.region WHERE id = ?")) {
				select.setInt(1, regionId);
				try (ResultSet result = select.executeQuery()) {
					boolean regionAdministrator = false;
					if (result.next()) {
						if (nation.equals(result.getString("delegate")) || nation.equals(result.getString("founder"))) {
							regionAdministrator = true;
						}
					}
					if (!regionAdministrator) {
						return Results.unauthorized();
					}
				}
			}

			try (PreparedStatement newspaper = conn.prepareStatement("UPDATE assembly.newspapers SET disbanded = 1 WHERE region = ?")) {
				newspaper.setInt(1, regionId);
				newspaper.executeUpdate();
			}
		}
		return Results.ok();
	}

	public Result findNewspaper(String region) throws SQLException {
		region = Utils.sanitizeName(region);
		int regionId = getDatabase().getRegionId(region);
		if (regionId != -1) {
			try (Connection conn = getConnection()) {
				JsonNode newspaper = getNewspaper(conn, getDatabase().getRegionId(region));
				if (newspaper != null) {
					Result r = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(newspaper.hashCode()), "300");
					if (r != null) {
						return r;
					}
					return ok(newspaper).as("application/json");
				}
			}
		}
		Utils.handleDefaultPostHeaders(request(), response());
		response().setHeader("Cache-Control", "public, max-age=300");
		return Results.notFound();
	}

	public static JsonNode getNewspaper(Connection conn, int region) throws SQLException {
		try (PreparedStatement articles = conn.prepareStatement("SELECT id, title FROM assembly.newspapers WHERE disbanded = 0 AND region = ?")) {
			articles.setInt(1, region);
			try (ResultSet result = articles.executeQuery()) {
				if (result.next()) {
					Map<String, Object> newspaper = new HashMap<String, Object>();
					newspaper.put("newspaper_id", result.getInt(1));
					newspaper.put("title", result.getString(2));
					return Json.toJson(newspaper);
				}
			}
		}
		return null;
	}

	public Result findLatestUpdate(int id) throws SQLException {
		JsonNode lastUpdate;
		try (Connection conn = getConnection()) {
			lastUpdate = getLatestUpdate(conn, id);
		}

		Result r = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(lastUpdate.hashCode()), "7200");
		if (r != null) {
			return r;
		}
		return ok(lastUpdate).as("application/json");
	}

	public static JsonNode getLatestUpdate(Connection conn, int id) throws SQLException {
		Map<String, Object> newspaper = new HashMap<String, Object>();
		try (PreparedStatement articles = conn.prepareStatement("SELECT max(articles.timestamp) FROM assembly.articles WHERE newspaper = ? AND visible = 1")) {
			articles.setInt(1, id);
			try (ResultSet result = articles.executeQuery()) {
				if (result.next()) {
					newspaper.put("timestamp", result.getLong(1));
				}
			}
		}
		newspaper.put("newspaper_id", id);
		return Json.toJson(newspaper);
	}

	public static JsonNode getLatestUpdateForRegion(Connection conn, int regionId) throws SQLException {
		Map<String, Object> newspaper = new HashMap<String, Object>();
		try (PreparedStatement articles = conn.prepareStatement("SELECT max(articles.timestamp), articles.newspaper FROM assembly.articles INNER JOIN assembly.newspapers ON newspapers.id = articles.newspaper WHERE newspapers.region = ? AND newspapers.disbanded = 0 AND articles.visible = 1")) {
			articles.setInt(1, regionId);
			try (ResultSet result = articles.executeQuery()) {
				if (result.next()) {
					newspaper.put("timestamp", result.getLong(1));
					newspaper.put("newspaper_id", result.getInt(2));
				}
			}
		}
		return Json.toJson(newspaper);
	}

	public static JsonNode getPendingSubmissions(Connection conn, int newspaper) throws SQLException {
		try (PreparedStatement articles = conn.prepareStatement("SELECT count(articles.id) FROM assembly.articles WHERE newspaper = ? AND visible = ?")) {
			articles.setInt(1, newspaper);
			articles.setInt(2, Visibility.SUBMITTED.getType());
			try(ResultSet result = articles.executeQuery()) {
				if (result.next()) {
					Map<String, Object> submissions = new HashMap<String, Object>();
					submissions.put("submissions", result.getInt(1));
					submissions.put("newspaper", newspaper);
					return Json.toJson(submissions);
				}
			}
		}
		return null;
	}

	public Result getNewspaperDetails(int id) throws SQLException {
		Map<String, Object> newspaper = new HashMap<String, Object>();
		newspaper.put("newspaper_id", id);

		try (Connection conn = getConnection()) {
			try (PreparedStatement select = conn.prepareStatement("SELECT newspapers.title, newspapers.byline, newspapers.editor, region.title, newspapers.columns FROM assembly.newspapers INNER JOIN assembly.region ON newspapers.region = region.id WHERE newspapers.id = ?")) {
				select.setInt(1, id);
				try (ResultSet result = select.executeQuery()) {
					if (result.next()) {
						newspaper.put("newspaper", result.getString(1));
						newspaper.put("byline", result.getString(2));
						newspaper.put("editor", result.getString(3));
						newspaper.put("region", result.getString(4));
						newspaper.put("columns", result.getInt(5));
					}
				}
				try (PreparedStatement editors = conn.prepareStatement("SELECT n.name, n.full_name FROM assembly.newspaper_editors AS e LEFT OUTER JOIN assembly.nation AS n ON n.id = e.nation_id WHERE newspaper = ?")) {
					editors.setInt(1, id);
					try (ResultSet set = editors.executeQuery()) {
						ArrayList<Map<String, String>> editorNations = new ArrayList<Map<String, String>>();
						while(set.next()) {
							Map<String, String> nation = new HashMap<String, String>(2);
							nation.put("name", set.getString(1));
							nation.put("formatted_name", set.getString(2));
							editorNations.add(nation);
						}
						newspaper.put("editors", editorNations);
					}
				}
			}
		}

		Result r = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(newspaper.hashCode()), "30");
		if (r != null) {
			return r;
		}
		return ok(Json.toJson(newspaper)).as("application/json");
	}

	private JsonNode getNewspaperImpl(int id, int visible, boolean hideBody, int lookupArticleId) throws SQLException {
		Map<String, Object> newspaper = new HashMap<String, Object>();
		ArrayList<Map<String, Object>> news = new ArrayList<Map<String, Object>>();
		try (Connection conn = getConnection()) {
			try (PreparedStatement select = conn.prepareStatement("SELECT title, byline, editor, newspapers.columns FROM assembly.newspapers WHERE id = ? ")) {
				select.setInt(1, id);
				try (ResultSet result = select.executeQuery()) {
					if (result.next()) {
						newspaper.put("newspaper", result.getString(1));
						newspaper.put("byline", result.getString(2));
						newspaper.put("editor", result.getString(3));
						newspaper.put("columns", String.valueOf(result.getInt(4)));
					} else {
						return null;
					}
				}
			}

			try (PreparedStatement articles = conn.prepareStatement("SELECT id, title, articles.timestamp, author, visible, submitter" + (!hideBody ? ", article " : "") + " FROM assembly.articles WHERE visible <> " + Visibility.DELETED.getType() + " AND newspaper = ? " + (lookupArticleId != -1 ? " AND id = ? " : "") + (visible != -1 ? " AND visible = ?" : ""))) {
				int index = 1;
				articles.setInt(index, id);
				index++;
				if (lookupArticleId != -1) {
					articles.setInt(index, lookupArticleId);
					index++;
				}
				if (visible != -1) {
					articles.setInt(index, visible);
					index++;
				}
				try (ResultSet result = articles.executeQuery()) {
					while (result.next()) {
						Map<String, Object> article = new HashMap<String, Object>();
						article.put("article_id", String.valueOf(result.getInt(1)));
						article.put("title", result.getString(2));
						article.put("timestamp", String.valueOf(result.getLong(3)));
						article.put("author", result.getString(4));
						article.put("newspaper", String.valueOf(id));
						article.put("visible", String.valueOf(result.getByte(5)));
						article.put("submitter", Nation.getNationById(conn, result.getInt(6), false));
						if (!hideBody) {
							article.put("article", result.getString(7));
						}
						news.add(article);
					}
				}
			}
		}
		newspaper.put("articles", news);
		newspaper.put("newspaper_id", id);
		return Json.toJson(newspaper);
	}

	public Result getNewspaper(int id, int visible, boolean hideBody, int lookupArticleId) throws SQLException {
		JsonNode newspaper = getNewspaperImpl(id, visible, hideBody, lookupArticleId);

		if (newspaper != null) {
			Result r = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(newspaper.hashCode()), "0");
			if (r != null) {
				return r;
			}
			return ok(Json.toJson(newspaper)).as("application/json");
		} else {
			Utils.handleDefaultGetHeaders(request(), response(), "0");
			return badRequest();
		}
	}

	public static Set<Integer> getEditorshipsOfNation(int nationId, Connection conn) throws SQLException {
		if (nationId != -1) {
			HashSet<Integer> newspapers = new HashSet<Integer>();
			try (PreparedStatement select = conn.prepareStatement("SELECT newspaper FROM assembly.newspaper_editors WHERE nation_id = ?")) {
				select.setInt(1, nationId);
				try (ResultSet set = select.executeQuery()) {
					while(set.next()) {
						newspapers.add(set.getInt(1));
					}
				}
			}
			return newspapers;
		}
		return Collections.emptySet();
	}

	public Result changeEditors(int newspaper) throws SQLException {
		Result result = canEditImpl(newspaper, true, Utils.getPostValue(request(), "nation"));
		if (result != null) {
			return result;
		}
		String add = Utils.getPostValue(request(), "add");
		String remove = Utils.getPostValue(request(), "remove");
		String submitter = Utils.getPostValue(request(), "nation");
		
		try (Connection conn = getConnection()) {
			if (!isEditorInChief(newspaper, submitter, conn)) {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.unauthorized();
			}

			Set<Integer> existingEditors = new HashSet<Integer>();
			try (PreparedStatement select = conn.prepareStatement("SELECT nation_id FROM assembly.newspaper_editors WHERE newspaper = ?")) {
				select.setInt(1, newspaper);
				try (ResultSet set = select.executeQuery()) {
					while (set.next()) {
						existingEditors.add(set.getInt(1));
					}
				}
			}

			Map<String, String> errors = new HashMap<String, String>();
			conn.setAutoCommit(false);
			try {
				Savepoint save = conn.setSavepoint(String.valueOf(System.currentTimeMillis()));
				if (add != null) {
					for (String nation : add.split(",")) {
						final String format = Utils.sanitizeName(nation);
						final int nationId = getDatabase().getNationId(format);
						if (nationId > -1) {
							if (!existingEditors.contains(nationId)) {
								try (PreparedStatement editors = conn.prepareStatement("INSERT INTO assembly.newspaper_editors (newspaper, nation_id) VALUES (?, ?)")) {
									editors.setInt(1, newspaper);
									editors.setInt(2, nationId);
									editors.executeUpdate();
								}
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
						final String format = Utils.sanitizeName(nation);
						if (format.equals(submitter)) {
							errors.put("error", "Cannot remove Editor-in-Chief");
							conn.rollback(save);
							Utils.handleDefaultPostHeaders(request(), response());
							return Results.ok(Json.toJson(errors)).as("application/json");
						}
						final int nationId = getDatabase().getNationId(format);
						if (nationId > -1) {
							if (existingEditors.contains(nationId)) {
								try (PreparedStatement editors = conn.prepareStatement("DELETE FROM assembly.newspaper_editors WHERE newspaper = ? AND nation_id = ?")) {
									editors.setInt(1, newspaper);
									editors.setInt(2, nationId);
									editors.executeUpdate();
								}
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
				conn.setAutoCommit(true);
			}
		}
		Utils.handleDefaultPostHeaders(request(), response());
		return Results.ok();
	}

	private boolean isEditorInChief(int newspaper, String nation, Connection conn) throws SQLException {
		try (PreparedStatement select = conn.prepareStatement("SELECT editor FROM assembly.newspapers WHERE id = ? ")) {
			select.setInt(1, newspaper);
			try (ResultSet set = select.executeQuery()) {
				if (set.next()) {
					return set.getString(1).equals(nation);
				}
			}
			return false;
		}
	}

	private Result canEditImpl(int newspaper, boolean checkAuth, String nation) throws SQLException {
		if (checkAuth) {
			Result result = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
			if (result != null) {
				return result;
			}
		}
		try (Connection conn = getConnection()) {
			if (!isEditorInChief(newspaper, nation, conn)) {
				try (PreparedStatement editors = conn.prepareStatement("SELECT nation_id FROM assembly.newspaper_editors WHERE newspaper = ?")) {
					editors.setInt(1, newspaper);
					try (ResultSet set = editors.executeQuery()) {
						final int nationId = getDatabase().getNationId(nation);
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
					}
				}
			}
		}
		return null;
	}

	public Result canEdit(int newspaper) throws SQLException {
		Result result = canEditImpl(newspaper, true, Utils.getPostValue(request(), "nation"));
		if (result != null) {
			return result;
		}
		Utils.handleDefaultPostHeaders(request(), response());
		return Results.ok();
	}

	public Result isEditor(int newspaper, String nation) throws SQLException {
		Result result = canEditImpl(newspaper, false, nation);
		if (result != null) {
			return result;
		}
		Utils.handleDefaultGetHeaders(request(), response(), null, "120");
		return Results.ok();
	}

	public Result administrateNewspaper(int newspaper) throws SQLException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (result != null) {
			return result;
		}
		String nation = Utils.getPostValue(request(), "nation");
		String title = Utils.getPostValue(request(), "title");
		String byline = Utils.getPostValue(request(), "byline");
		String columns = Utils.getPostValue(request(), "columns");

		Utils.handleDefaultPostHeaders(request(), response());
		if (title == null || title.length() > 255 || byline == null || byline.length() > 255) {
			return Results.badRequest();
		}
		Connection conn = null;
		try {
			conn = getConnection();

			if (!isEditorInChief(newspaper, nation, conn)) {
				Utils.handleDefaultPostHeaders(request(), response());
				return Results.unauthorized();
			}

			try (PreparedStatement update = conn.prepareStatement("UPDATE assembly.newspapers SET title = ?, byline = ?" + (columns != null ? ", newspapers.columns = ?" : "") + " WHERE id = ?")) {
				update.setString(1, title);
				update.setString(2, byline);
				if (columns != null) {
					update.setInt(3, Math.max(1, Math.min(3, Integer.parseInt(columns))));
					update.setInt(4, newspaper);
				} else {
					update.setInt(3, newspaper);
				}
				update.executeUpdate();
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return Results.ok();
	}

	public Result getLatestArticles(int start) throws SQLException {
		start = Math.max(0, start);
		List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
		try (Connection conn = getConnection()) {
			try (PreparedStatement newspaperRegion = conn.prepareStatement("SELECT region.title FROM assembly.newspapers INNER JOIN assembly.region ON newspapers.region = region.id WHERE newspapers.id = ?")) {
				try (PreparedStatement articles = conn.prepareStatement("SELECT newspaper, article, title, timestamp, author, newspaper_name, id, submitter FROM assembly.full_articles WHERE visible = 1 ORDER BY timestamp DESC LIMIT ?, 10")) {
					articles.setInt(1, start);
					try (ResultSet set = articles.executeQuery()) {
						while(set.next()) {
							Map<String, Object> article = new HashMap<String, Object>();
							article.put("newspaper_id", set.getInt(1));
							article.put("article", set.getString(2));
							article.put("title", set.getString(3));
							article.put("timestamp", set.getLong(4));
							article.put("author", set.getString(5));
							article.put("newspaper", set.getString(6));
							article.put("article_id", set.getInt(7));
							article.put("submitter", Nation.getNationById(conn, set.getInt(8), false));

							newspaperRegion.setInt(1, set.getInt(1));
							try (ResultSet region = newspaperRegion.executeQuery()) {
								if (region.next()) {
									article.put("region", region.getString(1));
								}
							}

							list.add(article);
						}
					}
				}
			}
		}
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(list.hashCode()), "180");
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(list)).as("application/json");
	}

	public Result submitArticle(int newspaper, int articleId) throws SQLException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (result != null) {
			return result;
		}
		String article = Utils.getPostValue(request(), "article");
		String title = Utils.getPostValue(request(), "title");
		String timestamp = Utils.getPostValue(request(), "timestamp");
		String author = Utils.getPostValue(request(), "author");
		String visible = Utils.getPostValue(request(), "visible");
		String nation = Utils.getPostValue(request(), "nation");
		if (article == null || title == null || timestamp == null || author == null || newspaper == -1) {
			Utils.handleDefaultPostHeaders(request(), response());
			return Results.badRequest();
		}
		try (Connection conn = getConnection()) {
			final Set<Integer> editorIds = new HashSet<Integer>();
			boolean validEditor = isEditorInChief(newspaper, nation, conn);

			try (PreparedStatement editors = conn.prepareStatement("SELECT nation_id FROM assembly.newspaper_editors WHERE newspaper = ?")) {
				editors.setInt(1, newspaper);
				try (ResultSet set = editors.executeQuery()) {
					while (set.next()) {
						editorIds.add(set.getInt(1));
					}
				}
			}
			
			final int nationId = getDatabase().getNationId(nation);
			validEditor |= editorIds.contains(nationId);

			if (!validEditor || nationId == -1) {
				if (Integer.parseInt(visible) != Visibility.SUBMITTED.getType()) {
					Utils.handleDefaultPostHeaders(request(), response());
					return Results.unauthorized();
				} else {
					//Allow volunteer articles to be edited by their submitter while not yet approved
					try (PreparedStatement submissions = conn.prepareStatement("SELECT id FROM assembly.articles WHERE visible = ? AND newspaper = ? AND submitter = ?")) {
						submissions.setInt(1, Visibility.SUBMITTED.getType());
						submissions.setInt(2, newspaper);
						submissions.setInt(3, nationId);
						try (ResultSet set = submissions.executeQuery()) {
							if (set.next() && set.getInt(1) != articleId) {
								Utils.handleDefaultPostHeaders(request(), response());
								return Results.unauthorized();
							}
						}
					}
				}
			}
			
			article = imgurizeArticle(article, imgurClientKey);
			if (articleId == -1) {
				try (PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.articles (newspaper, article, title, articles.timestamp, author, visible, submitter) VALUES (?, ?, ?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS)) {
					insert.setInt(1, newspaper);
					insert.setString(2, article);
					insert.setString(3, title);
					insert.setLong(4, Long.parseLong(timestamp));
					insert.setString(5, author);
					insert.setInt(6, Integer.parseInt(visible));
					insert.setInt(7, nationId);
					insert.executeUpdate();
					try (ResultSet keys = insert.getGeneratedKeys()) {
						keys.next();
						articleId = keys.getInt(1);
					}
				}
			} else {
				try (PreparedStatement insert = conn.prepareStatement("UPDATE assembly.articles SET article = ?, title = ?, articles.timestamp = ?, author = ?, visible = ? WHERE id = ?")) {
					insert.setString(1, article);
					insert.setString(2, title);
					insert.setLong(3, Long.parseLong(timestamp));
					insert.setString(4, author);
					insert.setInt(5, Integer.parseInt(visible));
					insert.setInt(6, articleId);
					insert.executeUpdate();
				}
			}

			//Automatically archive oldest content after 20 articles
			int articles = 0;
			long archiveAfter = 0;
			try (PreparedStatement existingContent = conn.prepareStatement("SELECT timestamp FROM assembly.articles WHERE newspaper = ? AND visible = ? ORDER BY TIMESTAMP DESC")) {
				existingContent.setInt(1, newspaper);
				existingContent.setInt(2, Visibility.VISIBLE.getType());
				ResultSet content = existingContent.executeQuery();
				while(content.next()) {
					if (articles <= 20) {
						archiveAfter = content.getLong(1);
					}
					articles++;
				}
			}
			
			//Archive older content
			if (articles > 20) {
				try (PreparedStatement updateOrder = conn.prepareStatement("UPDATE assembly.articles SET visible = ? WHERE newspaper = ? AND visible = ? AND articles.timestamp < ?")) {
					updateOrder.setInt(1, Visibility.RETIRED.getType());
					updateOrder.setInt(2, newspaper);
					updateOrder.setInt(3, Visibility.VISIBLE.getType());
					updateOrder.setLong(4, archiveAfter);
					updateOrder.executeUpdate();
				}
			}

			//Send update to clients
			if (Integer.parseInt(visible) == Visibility.VISIBLE.getType()) {
				Set<Integer> nations = null;
				RequestType rType;
				if (newspaper == GAMEPLAY_NEWS) rType = RequestType.GAMEPLAY_NEWS_SIDEBAR;
				else if (newspaper == ROLEPLAY_NEWS) rType = RequestType.ROLEPLAY_NEWS_SIDEBAR;
				else {
					rType = RequestType.REGIONAL_NEWS_SIDEBAR;
					try (PreparedStatement regionResidents = conn.prepareStatement("SELECT nation.id FROM assembly.nation INNER JOIN assembly.newspapers ON newspapers.region = nation.region WHERE newspapers.id = ?")) {
						regionResidents.setInt(1, newspaper);
						try (ResultSet set = regionResidents.executeQuery()) {
							nations = new HashSet<Integer>();
							while (set.next()) {
								nations.add(set.getInt(1));
							}
						}
					}
				}
				getDatabase().getWebsocketManager().onUpdate(PageType.DEFAULT, rType, getBlankRequest(rType), getLatestUpdate(conn, newspaper), nations);
			}
			//Send update to editors
			getDatabase().getWebsocketManager().onUpdate(PageType.DEFAULT, RequestType.PENDING_NEWS_SUBMISSIONS, getBlankRequest(RequestType.PENDING_NEWS_SUBMISSIONS), getPendingSubmissions(conn, newspaper), editorIds);
		}
		Utils.handleDefaultPostHeaders(request(), response());
		return Results.ok();
	}

	private static enum Visibility {
		DRAFT(0),
		VISIBLE(1),
		RETIRED(2),
		SUBMITTED(3),
		DELETED(4);
		int type;
		Visibility(int type) {
			this.type = type;
		}

		public int getType() {
			return type;
		}
	}

	private static final Pattern imgTag = Pattern.compile("\\[img\\]\\S*\\[/img\\]", Pattern.CASE_INSENSITIVE);
	private static String imgurizeArticle(String article, String imgurClientKey) {
		if (imgurClientKey != null) {
			Matcher matcher = imgTag.matcher(article);
			while(matcher.find()) {
				final String match = matcher.group();
				String imageData = matcher.group().substring(5, match.length() - 6);
				if (imageData.startsWith("data:image/jpeg;base64,")) {
					try {
						String imgurUrl = Utils.uploadToImgur(null, imageData.substring("data:image/jpeg;base64,".length()), imgurClientKey);
						return imgurizeArticle(article.replaceAll(Pattern.quote(match), "[img]" + imgurUrl + "[/img]"), imgurClientKey);
					} catch (IOException e) {
						Logger.error("Unable to upload base64 data [" + imageData.substring("data:image/jpeg;base64,".length()) + "] to imgur", e);
					}
				}
				else if (!imageData.contains("imgur.com")) {
					try {
						String imgurUrl = Utils.uploadToImgur(imageData, null, imgurClientKey);
						return imgurizeArticle(article.replaceAll(Pattern.quote(match), "[img]" + imgurUrl + "[/img]"), imgurClientKey);
					} catch (IOException e) {
						Logger.error("Unable to upload url [" + imageData + "] to imgur", e);
					}
				}
			}
		}
		return article;
	}
}
