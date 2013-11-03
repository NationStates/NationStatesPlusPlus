package controllers;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.net.ssl.HttpsURLConnection;

import org.apache.commons.dbutils.DbUtils;
import org.apache.commons.io.IOUtils;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;
import org.spout.cereal.config.ConfigurationNode;
import org.spout.cereal.config.yaml.YamlConfiguration;

import play.Logger;
import play.libs.Json;
import play.mvc.Result;
import play.mvc.Results;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.EncodingUtil;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;

public class NewspaperController extends NationStatesController {
	private final String imgurClientKey;
	public NewspaperController(DatabaseAccess access, YamlConfiguration config, NationStates api) {
		super(access, config, api);
		ConfigurationNode imgurAuth = getConfig().getChild("imgur");
		imgurClientKey = imgurAuth.getChild("client-key").getString(null);
	}

	public Result foundNewspaper(String region) throws SQLException, ExecutionException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
		if (ret != null) {
			return ret;
		}
		String nation = Utils.sanitizeName(Utils.getPostValue(request(), "nation"));
		
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
				Logger.info("Attempting to found paper for " + region + ", nation: " + nation);
				Logger.info("Delegate: " + result.getString(1) + " | Founder: " + result.getString(2));
				if (!nation.equals(result.getString(1)) && !nation.equals(result.getString(2))) {
					regionAdministrator = false;
				}
			} else {
				Logger.info("Attempting to found paper for " + region + ", no region found!");
				regionAdministrator = false;
			}
			if (!regionAdministrator) {
				return Results.unauthorized();
			}
			
			newspaper = conn.prepareStatement("INSERT INTO assembly.newspapers (region, editor, title, byline) VALUES (?, ?, ?, ?)");
			newspaper.setString(1, region);
			newspaper.setString(2, nation);
			newspaper.setString(3, Utils.formatName(nation) + " Regional News");
			newspaper.setString(4, Utils.formatName(nation) + " makes the trains run on time!");
			newspaper.executeUpdate();
			
			newspaper = conn.prepareStatement("SELECT newspaper FROM assembly.newspapers WHERE disbanded = 0 AND region = ?");
			newspaper.setString(1, region);
			result = newspaper.executeQuery();
			result.next();
			final int newspaperId = result.getInt(1);
			results.put("newspaper_id", newspaperId);
			
			PreparedStatement editors = conn.prepareStatement("INSERT INTO assembly.newspaper_editors (newspaper, nation_id) VALUES (?, ?)");
			editors.setInt(1, newspaperId);
			editors.setInt(2, getDatabase().getNationIdCache().get(nation));
			editors.executeUpdate();
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return Results.ok(Json.toJson(results)).as("application/json");
	}

	public Result disbandNewspaper(String region) throws SQLException {
		Result ret = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
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
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(newspaper.hashCode()), "15");
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

		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(newspaper.hashCode()), "60");
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
			PreparedStatement editors = conn.prepareStatement("SELECT n.name, n.full_name FROM assembly.newspaper_editors AS e LEFT OUTER JOIN assembly.nation AS n ON n.id = e.nation_id WHERE newspaper = ?");
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
			PreparedStatement select = conn.prepareStatement("SELECT title, byline, editor FROM assembly.newspapers WHERE newspaper = ? ");
			select.setInt(1, id);
			ResultSet result = select.executeQuery();
			if (result.next()) {
				newspaper.put("newspaper_id", id);
				newspaper.put("newspaper", result.getString(1));
				newspaper.put("byline", result.getString(2));
				newspaper.put("editor", result.getString(3));
			} else {
				Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(newspaper.hashCode()), "0");
				return Results.notFound();
			}

			PreparedStatement articles = conn.prepareStatement("SELECT article_id, article, title, articles.timestamp, author, articles.column, articles.order, visible FROM assembly.articles WHERE newspaper_id = ? " + (visible ? "AND visible = 1" : ""));
			articles.setInt(1, id);
			result = articles.executeQuery();
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

	public Result changeEditors(int newspaper) throws SQLException, ExecutionException {
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
					final String format = Utils.sanitizeName(nation);
					final int nationId = getDatabase().getNationIdCache().get(format);
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
					final String format = Utils.sanitizeName(nation);
					if (format.equals(editor)) {
						errors.put("error", "Cannot remove Editor-in-Chief");
						conn.rollback(save);
						Utils.handleDefaultPostHeaders(request(), response());
						return Results.ok(Json.toJson(errors)).as("application/json");
					}
					final int nationId = getDatabase().getNationIdCache().get(format);
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

	private Result canEditImpl(int newspaper) throws SQLException, ExecutionException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
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
			final int nationId = getDatabase().getNationIdCache().get(Utils.sanitizeName(nation));
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

	public Result canEdit(int newspaper) throws SQLException, ExecutionException {
		Result result = canEditImpl(newspaper);
		if (result != null) {
			return result;
		}
		Utils.handleDefaultPostHeaders(request(), response());
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

	public Result getLatestArticles(int start) throws SQLException {
		start = Math.min(0, start);
		List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
		Connection conn = null;
		try {
			conn = getConnection();
			PreparedStatement articles = conn.prepareStatement("SELECT newspaper_id, article, title, timestamp, author, newspaper WHERE visible = 1 ORDER BY timestamp DESC LIMIT ?, ?");
			articles.setInt(1, start);
			articles.setInt(2, start + 10);
			ResultSet set = articles.getResultSet();
			while(set.next()) {
				Map<String, Object> article = new HashMap<String, Object>();
				article.put("newspaper_id", set.getInt(1));
				article.put("article", set.getString(2));
				article.put("title", set.getString(3));
				article.put("timestamp", set.getLong(4));
				article.put("author", set.getString(5));
				article.put("newspaper", set.getString(6));
				list.add(article);
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		Result result = Utils.handleDefaultGetHeaders(request(), response(), String.valueOf(list.hashCode()), "180");
		if (result != null) {
			return result;
		}
		return ok(Json.toJson(list)).as("application/json");
	}

	public Result submitArticle(int newspaper, int articleId) throws SQLException, ExecutionException {
		Result result = Utils.validateRequest(request(), response(), getAPI(), getDatabase());
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
			final int nationId = getDatabase().getNationIdCache().get(Utils.sanitizeName(nation));
			boolean validEditor = false;
			while (set.next()) {
				if (set.getInt(1) == nationId) {
					validEditor = true;
					break;
				}
			}
			
			int submitterId = getDatabase().getNationIdCache().get(Utils.sanitizeName(nation));
			
			if (!validEditor || submitterId == -1) {
				if (Integer.parseInt(visible) != Visibility.SUBMITTED.getType()) {
					Utils.handleDefaultPostHeaders(request(), response());
					return Results.unauthorized();
				} else {
					PreparedStatement submissions = conn.prepareStatement("SELECT article_id FROM assembly.articles WHERE newspaper_id = ? AND submitter = ?");
					submissions.setInt(1, newspaper);
					submissions.setInt(2, submitterId);
					set = submissions.executeQuery();
					if (set.next() && set.getInt(1) != articleId) {
						Utils.handleDefaultPostHeaders(request(), response());
						return Results.unauthorized();
					}
				}
			}
			
			article = imgurizeArticle(article, imgurClientKey);
			
			if (articleId == -1) {
				PreparedStatement insert = conn.prepareStatement("INSERT INTO assembly.articles (newspaper_id, article, title, articles.timestamp, author, articles.column, articles.order, visible, submitter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
				insert.setInt(1, newspaper);
				insert.setString(2, article);
				insert.setString(3, title);
				insert.setLong(4, Long.parseLong(timestamp));
				insert.setString(5, author);
				insert.setInt(6, Integer.parseInt(column));
				insert.setInt(7, Integer.parseInt(order));
				insert.setInt(8, Integer.parseInt(visible));
				insert.setInt(9, submitterId);
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

	private static enum Visibility {
		DRAFT(0),
		VISIBLE(1),
		RETIRED(2),
		SUBMITTED(3);
		int type;
		Visibility(int type) {
			this.type = type;
		}

		public int getType() {
			return type;
		}
	}

	private static final Pattern imgTag = Pattern.compile("\\[img\\]\\S*\\[/img\\]");
	private static String imgurizeArticle(String article, String imgurClientKey) {
		if (imgurClientKey != null) {
			Matcher matcher = imgTag.matcher(article);
			while(matcher.find()) {
				final String match = matcher.group();
				String url = matcher.group().substring(5, match.length() - 6);
				if (!url.contains("imgur.com")) {
					try {
						String imgurUrl = uploadToImgur(url, imgurClientKey);
						return imgurizeArticle(article.replaceAll(Pattern.quote(match), "[img]" + imgurUrl + "[/img]"), imgurClientKey);
					} catch (IOException e) {
						Logger.error("Unable to upload url [" + url + "] to imgur", e);
					}
				}
			}
		}
		return article;
	}

	private static String uploadToImgur(String url, String clientKey) throws IOException {
		HttpsURLConnection conn = (HttpsURLConnection) (new URL("https://api.imgur.com/3/image")).openConnection();
		conn.addRequestProperty("Authorization", "Client-ID " + clientKey);
		conn.setDoInput(true);
		conn.setDoOutput(true);
		conn.setUseCaches(false);
		conn.setRequestMethod("POST");
		OutputStream out = null;
		try {
			out = conn.getOutputStream();
			IOUtils.write("image=" + EncodingUtil.encodeURIComponent(url) + "&type=URL", out);
			out.flush();
		} finally {
			IOUtils.closeQuietly(out);
		}

		InputStream stream = null;
		try {
			stream = conn.getInputStream();
			Map<String, Object> result = new ObjectMapper().readValue(stream, new TypeReference<HashMap<String,Object>>() {});
			@SuppressWarnings("unchecked")
			Map<String, Object> data = (Map<String, Object>) result.get("data");
			String link = (String) data.get("link");
			return link;
		} finally {
			IOUtils.closeQuietly(stream);
			conn.disconnect();
		}
	}
}
