package com.afforess.assembly.model.websocket;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

public class NationSettings {
	private Map<String, Object> settings = new HashMap<String, Object>();

	private long lastUpdate = 0L;

	public NationSettings() {
		
	}

	public <V> V getValue(String name, V defaultVal, Class<V> type) {
		if (settings.containsKey(name)) {
			return type.cast(settings.get(name));
		}
		return defaultVal;
	}

	public long getLastUpdate() {
		return lastUpdate;
	}

	public void setLastUpdate(long time) {
		lastUpdate = time;
	}

	public static NationSettings parse(String settings) {
		ObjectMapper mapper = new ObjectMapper();
		try {
			Map<String, Object> data = mapper.readValue(settings, new TypeReference<HashMap<String,Object>>() {});
			NationSettings parsed = new NationSettings();
			parsed.settings = data;
			return parsed;
		} catch (Exception e) {
			throw new RuntimeException("Unable to parse nation settings", e);
		}
	}

	public static void main(String[] args) {
		NationSettings s = parse("{\"newspapers\":{\"0\":1398991841760,\"1\":1399141489604,\"35\":1389383817185,\"53\":1389383798541,\"87\":1385578011831,\"102\":1389214296904,\"113\":1390197113252,\"127\":1389745534965,\"162\":1389383754417,\"176\":1389297907305,\"198\":1387265573108,\"227\":1390077125949,\"233\":1399090552138,\"258\":1386809387302,\"259\":1388053684157,\"284\":1391401132098,\"310\":1390242815633,\"347\":1389671311216,\"357\":1389744893165,\"386\":1389383766984,\"388\":1388779913594,\"389\":1389125681459,\"473\":1389394740621,\"538\":1390202890897,\"540\":1389381186568,\"570\":1390769259166,\"577\":1389991041871,\"610\":1389745713600,\"656\":1397626733789,\"790\":1394257174875,\"950\":1393461883238,\"969\":1393645931109,\"975\":1395360257729,\"988\":1394070619914,\"1054\":1399094438972,\"1147\":1398123644145},\"show-region-on-hover\":false,\"redirect-puppet-page\":false,\"autologin-puppets\":true,\"show_irc\":false,\"show_world_census\":false,\"show_regional_population\":true,\"last_puppet_email\":\"afforess@gmail.com\",\"small_screen_height\":false,\"banhammer_show_flags\":false,\"banhammer_length_of_residency\":false,\"banhammer_inversion\":true,\"highlight_color\":\"#39ee00\",\"embassy_flags\":true,\"search_rmb\":true,\"infinite_scroll\":true,\"show_ignore\":true,\"auto_update\":true,\"clickable_links\":true,\"show_all_suppressed_posts\":false,\"show_regional_map_preview\":true,\"show_wa_proposals\":false,\"clickable_telegram_links\":true,\"hide_ads\":true,\"scroll_nation_lists\":true,\"show_puppet_switcher\":true,\"fancy_dossier_theme\":true,\"show_gameplay_news\":true,\"show_roleplay_news\":true,\"show_regional_news\":true,\"floating_sidepanel\":true,\"show_dispatches\":false,\"post_ids\":true,\"egosearch_ignore\":true,\"highlight_op_posts\":true,\"show_unread_forum_posts\":false,\"use_nationstates_api\":true,\"highlight_color_transparency\":\"0.1\",\"automatically_hide_flag\":false,\"show_recruitment_progress\":false,\"spring_survey\":true}");
		@SuppressWarnings("unchecked")
		Map<String, Long> newspapers = s.getValue("newspapers", Collections.emptyMap(), Map.class);
		System.out.println(newspapers);
		System.out.println(newspapers.get("0").getClass());
	}
}
