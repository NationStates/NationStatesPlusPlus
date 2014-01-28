package com.afforess.assembly.model;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import org.apache.commons.dbutils.DbUtils;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;

public class RegionalStats {
	private final String name;
	private int id;
	private String flag;
	private String delegate;
	private String founder;
	private String title;
	private boolean alive;
	private long totalPopulation;
	private int numNations;
	private int numWaMembers;
	private int tax;
	private int civilRights;
	private int economy;
	private int politicalFreedom;
	private int environment;
	private int socialEquality;
	private int education;
	private int lawAndOrder;
	private int administration;
	private int welfare;
	private int spirituality;
	private int defence;
	private int publictransport;
	private int healthcare;
	private int commerce;
	private int publicsector;
	private int hdi;

	public RegionalStats(String name) {
		this.name = name;
	}

	public boolean updateStats(DatabaseAccess access) throws SQLException {
		Connection conn = null;
		try {
			conn = access.getPool().getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT id, name, flag, delegate, founder, title, alive FROM assembly.region WHERE name = ?");
			select.setString(1, Utils.sanitizeName(name));
			ResultSet result = select.executeQuery();
			if (result.next()) {
				this.id = result.getInt("id");
				
				//Flag
				String flag = result.getString("flag").trim();
				if (flag.length() < 1) {
					flag = null;
				}
				if (result.getByte("alive") == 0) {
					flag = "http://nationstatesplusplus.com/nationstates/static/exregion.png";
				}
				this.flag = flag;

				//Founder
				String founder = result.getString("founder");
				if (founder != null && !founder.equals("0")) {
					PreparedStatement founderSelect = conn.prepareStatement("SELECT title FROM assembly.nation WHERE name = ?");
					founderSelect.setString(1, founder.trim());
					ResultSet set = founderSelect.executeQuery();
					if (set.next()) {
						this.founder = set.getString("title");
					}

					DbUtils.closeQuietly(set);
					DbUtils.closeQuietly(founderSelect);
				}
				
				//Delegate
				String delegate = result.getString("delegate");
				if (delegate != null && !"0".equals(delegate)) {
					PreparedStatement delegateSelect = conn.prepareStatement("SELECT title FROM assembly.nation WHERE name = ?");
					delegateSelect.setString(1, delegate.trim());
					ResultSet set = delegateSelect.executeQuery();
					if (set.next()) {
						this.delegate = set.getString("title");
					}

					DbUtils.closeQuietly(set);
					DbUtils.closeQuietly(delegateSelect);
				}
				
				//Title
				this.title = result.getString("title");
				
				//Alive
				this.alive = result.getByte("alive") == 1;

				DbUtils.closeQuietly(result);
				DbUtils.closeQuietly(select);
				
				PreparedStatement stats = conn.prepareStatement("SELECT count(id) AS population, sum(population) as total_population, median(civilrightscore) as civilrights, median(economyscore) AS economy, median(politicalfreedomscore) as politicalfreedom, median(environment) as environment, median(socialequality) as socialequality, median(education) as education, median(lawandorder) as lawandorder, median(administration) as administration, median(welfare) as welfare, median(spirituality) as spirituality, median(defence) as defence, median(publictransport) as publictransport, median(healthcare) as healthcare, median(commerce) as commerce, median(publicsector) as publicsector, median(tax) as tax FROM assembly.nation WHERE alive = 1 AND region = ?");
				stats.setInt(1, this.id);
				result = stats.executeQuery();
				result.next();
				
				this.numNations =  result.getInt("population");
				this.civilRights =  result.getInt("civilrights");
				this.economy = result.getInt("economy");
				this.politicalFreedom = result.getInt("politicalfreedom");
				this.environment = result.getInt("environment");
				this.socialEquality = result.getInt("socialequality");
				this.education = result.getInt("education");
				this.lawAndOrder = result.getInt("lawandorder");
				this.administration = result.getInt("administration");
				this.welfare =  result.getInt("welfare");
				this.spirituality = result.getInt("spirituality");
				this.defence = result.getInt("defence");
				this.publictransport = result.getInt("publictransport");
				this.healthcare = result.getInt("healthcare");
				this.commerce = result.getInt("commerce");
				this.publicsector = result.getInt("publicsector");
				this.tax = result.getInt("tax");
				this.totalPopulation = result.getInt("total_population");
				
				DbUtils.closeQuietly(result);
				DbUtils.closeQuietly(stats);
				
				stats = conn.prepareStatement("SELECT count(id) AS wa_members FROM assembly.nation WHERE alive = 1 AND wa_member = 1 AND region = ?");
				stats.setInt(1, this.id);
				result = stats.executeQuery();
				result.next();
				this.numWaMembers = result.getInt("wa_members");
				
				DbUtils.closeQuietly(result);
				DbUtils.closeQuietly(stats);
				
				stats = conn.prepareStatement("SELECT median(shard_68) AS hdi FROM assembly.latest_nation_shards AS l LEFT JOIN assembly.nation AS n ON n.id = l.nation WHERE n.region = ?");
				stats.setInt(1, this.id);
				result = stats.executeQuery();
				result.next();
				
				this.hdi = result.getInt("hdi");
				
				return true;
			}
		} finally {
			DbUtils.closeQuietly(conn);
		}
		return false;
	}

	public int getId() {
		return id;
	}

	public void setId(int id) {
		this.id = id;
	}

	public String getFlag() {
		return flag;
	}

	public void setFlag(String flag) {
		this.flag = flag;
	}

	public String getDelegate() {
		if (delegate == null || delegate.equals("0")) {
			return "No Delegate";
		}
		return delegate;
	}

	public void setDelegate(String delegate) {
		this.delegate = delegate;
	}

	public String getFounder() {
		if (founder == null || founder.equals("0")) {
			return "No Founder";
		}
		return founder;
	}

	public void setFounder(String founder) {
		this.founder = founder;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public boolean isAlive() {
		return alive;
	}

	public void setAlive(boolean alive) {
		this.alive = alive;
	}

	public long getTotalPopulation() {
		return totalPopulation;
	}

	public String getTotalPopulationDescription() {
		if (totalPopulation < 1000) {
			return totalPopulation + " million";
		}
		if (totalPopulation < 1000000) {
			return totalPopulation / 1000 + " billion";
		}
		return (totalPopulation / 10000) / 100F + " trillion";
	}

	public void setTotalPopulation(long totalPopulation) {
		this.totalPopulation = totalPopulation;
	}

	public int getTax() {
		return tax;
	}

	public void setTax(int tax) {
		this.tax = tax;
	}

	public int getNumNations() {
		return numNations;
	}
	
	public String getNumNationsDescription() {
		if (numNations < 5) {
			return "minuscule region";
		}
		if (numNations < 10) {
			return "small region";
		}
		if (numNations < 50) {
			return "medium region";
		}
		if (numNations < 100) {
			return "large region";
		}
		if (numNations < 500) {
			return "enormous region";
		}
		return "gargantuan region";
	}

	public void setNumNations(int numNations) {
		this.numNations = numNations;
	}

	public int getNumWaMembers() {
		return numWaMembers;
	}

	public void setNumWaMembers(int numWaMembers) {
		this.numWaMembers = numWaMembers;
	}

	public int getCivilRights() {
		return civilRights;
	}

	public void setCivilRights(int civilRights) {
		this.civilRights = civilRights;
	}

	public int getPoliticalFreedom() {
		return politicalFreedom;
	}

	public void setPoliticalFreedom(int politicalFreedom) {
		this.politicalFreedom = politicalFreedom;
	}

	public int getEnvironment() {
		return environment;
	}

	public void setEnvironment(int environment) {
		this.environment = environment;
	}

	public int getSocialEquality() {
		return socialEquality;
	}

	public void setSocialEquality(int socialEquality) {
		this.socialEquality = socialEquality;
	}

	public int getEducation() {
		return education;
	}

	public void setEducation(int education) {
		this.education = education;
	}

	public int getLawAndOrder() {
		return lawAndOrder;
	}

	public void setLawAndOrder(int lawAndOrder) {
		this.lawAndOrder = lawAndOrder;
	}

	public int getAdministration() {
		return administration;
	}

	public void setAdministration(int administration) {
		this.administration = administration;
	}

	public int getWelfare() {
		return welfare;
	}

	public void setWelfare(int welfare) {
		this.welfare = welfare;
	}

	public int getSpirituality() {
		return spirituality;
	}

	public void setSpirituality(int spirituality) {
		this.spirituality = spirituality;
	}

	public int getDefence() {
		return defence;
	}

	public void setDefence(int defence) {
		this.defence = defence;
	}

	public int getPublictransport() {
		return publictransport;
	}

	public void setPublictransport(int publictransport) {
		this.publictransport = publictransport;
	}

	public int getHealthcare() {
		return healthcare;
	}

	public void setHealthcare(int healthcare) {
		this.healthcare = healthcare;
	}

	public int getCommerce() {
		return commerce;
	}

	public void setCommerce(int commerce) {
		this.commerce = commerce;
	}

	public int getPublicsector() {
		return publicsector;
	}

	public void setPublicsector(int publicsector) {
		this.publicsector = publicsector;
	}

	public String getName() {
		return name;
	}

	public int getEconomy() {
		return economy;
	}

	public void setEconomy(int economy) {
		this.economy = economy;
	}

	public int getHumanDevelopmentIndex() {
		return hdi;
	}

	public void setHumanDevelopmentIndex(int hdi) {
		this.hdi = hdi;
	}

	private String getTaxDescription() {
		String tax = "";
		if (this.tax == 0) tax = "Income taxes are unheard of amongst the denizens of the region.";
		else if (this.tax < 10) tax = "Inhabitants rarely are visited by the tax collector, and the region boasts a paltry median tax rate of " + this.tax + "%.";
		else if (this.tax < 25) tax = "Denizens tend to pay their taxes quickly and quietly, with a median tax rate of " + this.tax + "%.";
		else if (this.tax < 50) tax = "The median tax rate of the region is " + this.tax + "%, but is frequently higher for the wealthy.";
		else if (this.tax < 75) tax = "Denizens suffer under an enormous tax burden throughout the region, with a median tax rate of " + this.tax + "%, and much higher for the wealthy.";
		else if (this.tax < 100) tax = "Inhabitants of the region ultimately pay most of their earnings to the government, as the median tax rate is " + this.tax + "%, or more!";
		else if (this.tax == 100) tax = "Inhabitants of the region pay their entire reported earnings to the government.";
		return tax;
	}

	private String getCivilRightsDescription() {
		String civilRights = "";
		if (this.civilRights == 0) civilRights = "Denizens of the <!--REGION_NAME_START--> <!--REGION_NAME_END--> have the right to remain silent.";
		else if (this.civilRights < 10) civilRights = "In <!--REGION_NAME_START--> <!--REGION_NAME_END-->, denizens scatter at the sight of strangers and are careful to keep carefully blank faces when approached.";
		else if (this.civilRights < 25) civilRights = "Throughout <!--REGION_NAME_START--> <!--REGION_NAME_END-->, traditions are kept strictly throughout the region, punishing upstarts and rabble-rousers harshly.";
		else if (this.civilRights < 50) civilRights = "The straight-backed, broad-smiling populace of <!--REGION_NAME_START--> <!--REGION_NAME_END--> eagerly dismissed concerns of oppression.";
		else if (this.civilRights < 75) civilRights = "In <!--REGION_NAME_START--> <!--REGION_NAME_END-->, denizens enjoy their civil rights, although not too much, or too freely.";
		else if (this.civilRights < 100) civilRights = "Throughout <!--REGION_NAME_START--> <!--REGION_NAME_END--> civil rights are held dearly by all.";
		else if (this.civilRights == 100) civilRights = "There is no such thing as society in <!--REGION_NAME_START--> <!--REGION_NAME_END-->, with denizens enjoying the right to do anything and everything.";
		return civilRights;
	}

	private String getPoliticalFreedomsDescription() {
		String description = "";
		if (this.politicalFreedom == 0) description = "Political freedom does not exist. The region is recognized as an extreme dictatorship.";
		else if (this.politicalFreedom < 10) description = "Political freedoms are extended only to close friends and relatives of the leaders of the region's governments.";
		else if (this.politicalFreedom < 25) description = "Denizens generally have very few political freedoms, but some limited freedom is afforded to citizens of nations in the region.";
		else if (this.politicalFreedom < 50) description = "Nations in the region are considered developing democracies, with some political freedoms afforded to denizens.";
		else if (this.politicalFreedom < 75) description = "Nations in the region are healthy democracies, with denizens being afforded an extensive array of political freedoms.";
		else if (this.politicalFreedom < 100) description = "Denizens are flush with political freedom, although competing opinions often mean that political gridlock is the norm.";
		else if (this.politicalFreedom == 100) description = "Nothing is true, everything is politically permitted.";
		return description;
	}
	
	private String getEnvironmentDescription() {
		String description = "";
		if (this.environment == 0) description = "The landscapes of the region are no longer recognizable as such, the atmosphere being unbreathable and the only jungles being made of concrete.";
		else if (this.environment < 10) description = "The environments of the nations in the region are almost universally appalling.";
		else if (this.environment < 25) description = "Natural environments are quite bad, although some measures have been undertaken to ensure that the environment is protected.";
		else if (this.environment < 50) description = "The region's landscapes are reasonably good, although the impact of the denizens has had a noticeable effect.";
		else if (this.environment < 75) description = "Environments within the region are very good, with a healthy balance of denizen's activity and regard for protection of nature.";
		else if (this.environment < 100) description = "Denizens live in stunning natural environments.";
		else if (this.environment == 100) description = "There is nothing in the nations of the region: the construction of anything which may affect the pristine natural environments being strictly prohibited.";
		return description;
	}

	private String getSocialEqualityDescription() {
		String description = "";
		if (this.socialEquality == 0) description = "In <!--REGION_NAME_START--> <!--REGION_NAME_END-->, Social inequality is total, with wealth being held by a tiny fraction of the region's populace.";
		else if (this.socialEquality < 10) description = "Social inequality is rife amongst the nations within <!--REGION_NAME_START--> <!--REGION_NAME_END-->.";
		else if (this.socialEquality < 25) description = "Social inequality is a major problem within <!--REGION_NAME_START--> <!--REGION_NAME_END-->, although some effort has been made to correct the problem.";
		else if (this.socialEquality < 50) description = "In <!--REGION_NAME_START--> <!--REGION_NAME_END-->, denizens benefit from a good balance of social equality and motivation for advancement, although aspiration is the priority.";
		else if (this.socialEquality < 75) description = "In <!--REGION_NAME_START--> <!--REGION_NAME_END-->, denizens benefit from a good balance of social equality and motivation for advancement, although equality is the priority.";
		else if (this.socialEquality < 100) description = "Throughout <!--REGION_NAME_START--> <!--REGION_NAME_END-->, denizens enjoy great equality, although sometimes wonder why they bother working at all.";
		else if (this.socialEquality == 100) description = "In <!--REGION_NAME_START--> <!--REGION_NAME_END-->, all the pigs are equal, but some are more equal than others.";
		return description;
	}

	private String getEducationDescription() {
		String description = "";
		if (this.education == 0) description = "In <!--REGION_NAME_START--> <!--REGION_NAME_END--> education, when conducted, is done with sticks and mud.";
		else if (this.education < 10) description = "Denizens of the <!--REGION_NAME_START--> <!--REGION_NAME_END--> are poorly educated, with rampant illiteracy.";
		else if (this.education < 25) description = "<!--REGION_NAME_START--> <!--REGION_NAME_END--> does not prioritize education in any meaningful way.";
		else if (this.education < 50) description = "In <!--REGION_NAME_START--> <!--REGION_NAME_END-->, denizens are afforded a reasonable education, although funding is somewhat wanting.";
		else if (this.education < 75) description = "Education is a priority for governments throughout <!--REGION_NAME_START--> <!--REGION_NAME_END-->, with ample funding being provided and teachers enjoying a great deal of support.";
		else if (this.education < 100) description = "<!--REGION_NAME_START--> <!--REGION_NAME_END--> values education extremely highly, and denizens compete for the largest number of university degrees and sprawling book collections";
		else if (this.education == 100) description = "In <!--REGION_NAME_START--> <!--REGION_NAME_END-->, everyone enjoys a classical education, which are the envy of the world.";
		return description;
	}
	
	private String getLawAndOrderDescription() {
		String description = "";
		if (this.lawAndOrder == 0) description = "The region is a lawless wasteland, nations regularly being the subject of documentaries by brave filmmakers. Governments make no provision for law and order.";
		else if (this.lawAndOrder < 10) description = "Criminality is rife within the region, with law enforcement struggling to cope. Governments allocate a meagre " + this.lawAndOrder + "%, on average, of their budgets to law and order.";
		else if (this.lawAndOrder < 25) description = "There is a very high level of crime within the region and law enforcement resources are stretched thin.";
		else if (this.lawAndOrder < 50) description = "The region's law enforcement officials try hard to combat a relatively high level of crime, but are hampered by a lack of funding.";
		else if (this.lawAndOrder < 75) description = "Crime is low: the region enjoys well-equipped and well-funded police forces, coupled with efficient but fair judicial systems.";
		else if (this.lawAndOrder < 100) description = "The region's law enforcement is arguably too well-equipped and overzealous, arresting citizens who dare to commit the most minor of infractions.";
		else if (this.lawAndOrder == 100) description = "GET YOUR HANDS UP! FACE THE WALL! THIS IS A RAID!";
		return description;
	}
	
	private String getAdministrationDescription() {
		String description = "";
		if (this.administration == 0) description = "Nobody really knows about the state of administration in <!--REGION_NAME_START--> <!--REGION_NAME_END-->. Observers asked for information, but found nobody was available to take calls.";
		else if (this.administration < 2) description = "Governments in <!--REGION_NAME_START--> <!--REGION_NAME_END--> find themselves in a constant state of disarray, with very little co-ordination, only " + this.administration + "% on average of government budgets being devoted to Administration.";
		else if (this.administration < 8) description = "Governments in <!--REGION_NAME_START--> <!--REGION_NAME_END--> communicate very well amongst themselves, with administration departments working smoothly, with " + this.administration + "% on average of government budgets being devoted to Administration.";
		else if (this.administration < 15) description = "Throughout <!--REGION_NAME_START--> <!--REGION_NAME_END-->, governments find themselves confused, with administration departments being so bloated that staff do not know what other staff are doing, with an average of over " + this.administration + "% of government budgets being devoted to Administration.";
		else if (this.administration < 50) description = "The administration departments of <!--REGION_NAME_START--> <!--REGION_NAME_END--> are all-consuming, soaking up budgets in aid of supporting a bureaucracy of millions, with an average of " + this.administration + "% of government budgets being devoted to Administration.";
		else if (this.administration < 100) description = "In <!--REGION_NAME_START--> <!--REGION_NAME_END-->, government departments are frequently completely unaware of one another, such is size of administration departments.";
		else if (this.administration == 100) description = "In terms of evaluating the impact of the administration in <!--REGION_NAME_START--> <!--REGION_NAME_END-->, observers were required to fill in forms F11, LM16 and BRF761, then take a IO41(a), paginate the bundle with a précis, refer it up to Deborah in HR, who'll return a G14(c) to certificate the receival of the request, then expect a response within six to eight weeks.";
		return description;
	}

	private String getWelfareDescription() {
		String description = "";
		if (this.welfare == 0) description = "No welfare is provided in the region. Those unlucky enough to fall into unemployment are forgotten and abandoned.";
		else if (this.welfare < 5) description = "Welfare in the region is minimal, with only a small amount of expenditure being devoted to spending on social security.";
		else if (this.welfare < 10) description = "Welfare is a large part of government expenditure, with denizens amply provided for.";
		else if (this.welfare < 25) description = "Denizens in the region suckle at the teat of government, with welfare comprising a large percentage of total government budgets.";
		else if (this.welfare < 75) description = "Governments in the region have a pathological fixation on welfare, with welfare budgets soaking up huge amounts of government expenditure.";
		else if (this.welfare <= 100) description = "The 'net through which none shall fall' in the region is more of a hammock.";
		return description;
	}

	private String getSpiritualityDescription() {
		String description = "";
		if (this.spirituality == 0) description = "Governments in the region are avowedly atheist - no public funds are allocated to spirituality.";
		else if (this.spirituality < 2) description = "Spirituality is a moderate priority of governments within the region, with" + this.spirituality + "% of government budgets being devoted to Spirituality.";
		else if (this.spirituality < 5) description = "Spirituality is a major priority of governments in the region, with a relatively high average of " + this.spirituality + "% of government budgets being devoted to Spirituality.";
		else if (this.spirituality < 10) description = "Spirituality is an obsession of governments in the region, with a relatively very high average of " + this.spirituality + "% of government budgets being devoted to Spirituality.";
		else if (this.spirituality < 50) description = "Governments within the region are fixated with religious worship, with nations having an inordinately high average of " + this.spirituality + "% of total government funds devoted to it.";
		else if (this.spirituality < 100) description = "Religion is an all-consuming priority within the region, with most government funds devoted to the study of scripture.";
		else if (this.spirituality == 100) description = "The region is a model of religious conformity, with all government funds devoted unto the study of the most holy scriptures.";
		return description;
	}

	private String getDefenceDescription() {
		String description = "";
		if (this.defence == 0) description = "Nations within the region are forced to use soft fruit and harsh language in the field of battle, with no government funds being set aside for defense.";
		else if (this.defence <5) description = "Denizens have small defense forces. ";
		else if (this.defence < 10) description = "Denizens have well-funded defense forces.";
		else if (this.defence < 20) description = "Denizens have very well-funded, well equipped defense forces.";
		else if (this.defence < 50) description = "Defense is a major priority for governments within the region, with a large chunk of government budgets being devoted to it.";
		else if (this.defence < 100) description = "Defense is an overarching priority for governments within the region. One might suggest they are compensating for something.";
		else if (this.defence == 100) description = "The region is armed to the teeth. Defense is all-consuming.";
		return description;
	}

	private String getPublicTransportDescription() {
		String description = "";
		if (this.publictransport == 0) description = "Public transport is considered dirty and trampish in the region. You would be mad to use it.";
		else if (this.publictransport < 3) description = "Public transport is something of an afterthought in government budgeting, with only " + this.publictransport + "% of total government budgets in the region being devoted to it.";
		else if (this.publictransport < 20) description = "Public transport is a popular mode of transport in the region, receiving on average of " + this.publictransport + "% of total government budgets.";
		else if (this.publictransport < 100) description = "Public transport is tremendously well-funded and of exceptionally high-quality, receiving on average of " + this.publictransport + "% of total government budgets. The usage of private transport is frowned upon.";
		else if (this.publictransport == 100) description = "Public transport is the only way to get around, is never late, and is clinically clean. Even cyclists are shot on sight for daring to use a private mode of transport.";
		return description;
	}

	private String getHealthcareDescription() {
		String description = "";
		if (this.healthcare == 0) description = "Hospital patients are given credit checks upon passing through emergency rooms, as no government provision is made for healthcare in the region.";
		else if (this.healthcare < 5) description = "Some government provision is made for healthcare, but at an average of only " + this.healthcare + "% the provision for healthcare in the region is paltry.";
		else if (this.healthcare < 10) description = "Governments generally endow their healthcare departments with a large amount of funding, with an average of " + this.healthcare +"% of government budgets across the region being devoted to healthcare.";
		else if (this.healthcare < 20) description = "Governments bestow their healthcare departments with a gargantuan amount of funding, with an average of " + this.healthcare + "% of government budgets across the region being heaped on to healthcare.";
		else if (this.healthcare < 50) description = "Governments are pathological about caring for the health of their citizens, with vast sums being ploughed into hospitals, doctors and medical research";
		else if (this.healthcare <= 100) description = "Healthcare in the region is unparalleled - broken fingernails are treated by world class doctors and patients are rushed to vast medical facilities in air ambulances for the most minor of injuries. Truly massive sums of money are devoted to healthcare and medical research. On average, governments in the region devote " + this.healthcare + "% of their budgets to healthcare.";
		return description;
	}

	private String getCommerceDescription() {
		String description = "";
		if (this.commerce == 0) description = "Commerce within the region is an irrelevant annoyance to governments.";
		else if (this.commerce < 5) description = "Commerce is low priority for governments, accounting for an average of " + this.commerce + "% of public expenditure, although commerce is generally seen as a source of tax revenue.";
		else if (this.commerce < 10) description = "Commerce is a priority for governments, accounting for an average of " + this.commerce + "% of public expenditure.";
		else if (this.commerce < 20) description = "Stoking commercial activity is a major priority for governments, accounting for an average of " + this.commerce + "% of public expenditure.";
		else if (this.commerce < 50) description = "Commerce is a major priority of national governments within the region, most of whom are trading nations, as is evidenced by the fact that commerce budgets account for an average of " + this.commerce + "% of public expenditure in the region.";
		else if (this.commerce < 100) description = "National governments within the region are more concerned with corporate welfare than the welfare of ordinary citizens, with commerce budgets accounting for an average of " + this.commerce + "% of public expenditure.";
		else if (this.commerce == 100) description = "Major trade deals are negotiated at the family dinner table and during lovemaking.";
		return description;
	}

	private String getPublicSectorDescription() {
		String description = "";
		if (this.publicsector == 0) description = "The region is a beacon of capitalism, with the public sector not existing in any meaningful way in constituent economies.";
		else if (this.publicsector < 10) description = "The economies of nations in the region tends to be dominated by the private sector, with on average only " + this.publicsector + "% of the economy comprising the public sector.";
		else if (this.publicsector < 40) description = "The economies of nations in the region tends to be heavily weighted towards the private sector, with on average only " + this.publicsector + "% of the economy comprising the public sector.";
		else if (this.publicsector < 50) description = "The economies of nations in the region tends to be weighted more towards the private sector, with on average only " + this.publicsector + "% of the economy comprising the public sector.";
		else if (this.publicsector == 50) description = "The economies of nations in the region are perfectly balanced between public and private sectors, with both comprising 50% of economic activity within the nations.";
		else if (this.publicsector < 60) description = "The economy of nations in the region tends to be weighted more towards the public sector, with on average only " + (100-this.publicsector) + "% of the economy comprising the private sector.";
		else if (this.publicsector < 90) description = "The economy of nations in the region tends to be heavily weighted towards the public sector, with on average only " + (100-this.publicsector) + "% of the economy comprising the private sector.";
		else if (this.publicsector < 100) description = "The region is a workers' paradise, as the governments of the region control nearly all of the economic output.";
		else if (this.publicsector == 100) description = "The region is a socialist utopia: private enterprise is strictly prohibited in the constituent economies.";
		return description;
	}

	public String getEconomyDescription() {
		String description = "";
		if (this.economy == 0) description = "The economy of the region exists only in the imaginations of its members.";
		else if (this.economy < 10) description = "Underwater basket weaving is a popular tradition amongst the denizens of the region, as well as its primary economic export.";
		else if (this.economy < 25) description = "Most denizens subsist off of basic farming or menial factory jobs, with few economic imports or exports.";
		else if (this.economy < 50) description = "The economy of the region is remarkably unremarkable, with members being neither powerhouses nor basket cases.";
		else if (this.economy < 75) description = "Economies in the region tend to be stronger than average, although most are not big enough to be considered heavyweights.";
		else if (this.economy < 100) description = "Families in the region are so obsessed with the economy that the discussion of laffer curves and supply-side reforms over supper is a regular occurrence in member nations.";
		else if (this.economy == 100) description = "It’s the economy, stupid... and in this region, it’s massive.";
		return description;
	}
	
	public String getNationsDescription() {
		String description = "";
		if (this.numNations == 1) description = "inhabited by a sole nation";
		else if (this.numNations < 5) description = "inhabited by a few solitary nations";
		else if (this.numNations < 10) description = "sparsely populated by only " + numNations + " nations";
		else if (this.numNations < 50) description = "with a thriving community with " + numNations + " nations";
		else if (this.numNations < 100) description = "with a bustling and busy community, numbering over " + numNations + " nations";
		else if (this.numNations < 500) description = "with a large community, renowned for its " + numNations + " member nations";
		else description = "with a massive community, boasting over " + numNations + " nations in the region";
		
		if (this.numWaMembers == 0) description += " and without any [[World Assembly]] representation.";
		else if (this.numWaMembers == 1) description += " and only one [[World Assembly]] Member.";
		else if (this.numWaMembers < 25) description += " and only " + numWaMembers + " [[World Assembly]] Members.";
		else if (this.numWaMembers < 50) description += ". <!--REGION_NAME_START--> <!--REGION_NAME_END--> features a very respectable representation in the [[World Assembly]], with " + numWaMembers + " member nations.";
		else if (this.numWaMembers < 100) description += ". <!--REGION_NAME_START--> <!--REGION_NAME_END--> also has a very large representation in the [[World Assembly]], with  " + numWaMembers + " member nations.";
		else if (this.numWaMembers < 500) description += ". <!--REGION_NAME_START--> <!--REGION_NAME_END--> is also feared by [[World Assembly]] members everywhere, with votes from " + numWaMembers + " member nations.";
		else description += ". <!--REGION_NAME_START--> <!--REGION_NAME_END--> is a truly dominating [[World Assembly]] bloc, with over " + numWaMembers + " member nations.";
		
		return description;
	}

	public String getRegionDescription() {
		StringBuilder builder = new StringBuilder(getNationsDescription());
		builder.append("\n\n").append(getCivilRightsDescription()).append(" ").append(getPoliticalFreedomsDescription()).append(" ").append(getEconomyDescription()).append(" ").append(getTaxDescription()).append(" ").append(getPublicSectorDescription()).append(" ").append(getCommerceDescription());
		builder.append("\n\n").append(getEducationDescription()).append(" ").append(getLawAndOrderDescription()).append(" ").append(getDefenceDescription()).append(" ").append(getPublicTransportDescription());
		builder.append("\n\n").append(getAdministrationDescription()).append(" ").append(getHealthcareDescription()).append(" ").append(getWelfareDescription()).append(" ").append(getSpiritualityDescription());
		builder.append("\n\n").append(getSocialEqualityDescription()).append(" ").append(getEnvironmentDescription());
		return builder.toString();
	}
}
