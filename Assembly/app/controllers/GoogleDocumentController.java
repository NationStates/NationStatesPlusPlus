package controllers;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

import org.apache.commons.io.IOUtils;

import play.Logger;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.Results;

public class GoogleDocumentController extends Controller {
	
	public Result getGoogleDocument() {
		final Map<String, String[]> values = request().body().asFormUrlEncoded();
		
		response().setHeader("Access-Control-Allow-Origin", "*");
		response().setHeader("Access-Control-Allow-Methods", "POST, GET, HEAD");
		response().setHeader("Access-Control-Max-Age", "300");
		response().setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		
		if (values != null && values.containsKey("doc")) {
			String document = values.get("doc")[0];
			if (document != null) {
				try {
					URL url = new URL("https://docs.google.com/" + document);
					HttpURLConnection conn = (HttpURLConnection) url.openConnection();
					conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Ubuntu 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36");
					conn.setUseCaches(false);
					String page = IOUtils.toString(conn.getInputStream());
					
					return Results.ok(page).as("text/html");
				} catch (Exception e) {
					Logger.error("Unable to open page [https://docs.google.com/" + document + "]", e);
					return Results.internalServerError();
				}
			}
		}
		return Results.badRequest();
	}
}
