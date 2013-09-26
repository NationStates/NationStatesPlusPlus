import sbt._
import Keys._
import play.Project._

object ApplicationBuild extends Build {

  val appName         = "Assembly"
  val appVersion      = "1.0-SNAPSHOT"

  val appDependencies = Seq(
    javaCore,
	"mysql" % "mysql-connector-java" % "5.1.24",
	"commons-io" % "commons-io" % "2.3",
	"commons-lang" % "commons-lang" % "2.6",
	"com.mchange" % "c3p0" % "0.9.2.1",
	"org.jsoup" % "jsoup" % "1.7.2",
	"com.firebase" % "firebase-client" % "1.0.2",
	"com.firebase" % "firebase-token-generator" % "1.0.2",
	"commons-dbutils" % "commons-dbutils" % "1.5",
	"com.typesafe.play.extras" % "iteratees-extras_2.10" % "1.0.1",
	"com.amazonaws" % "aws-java-sdk" % "1.4.3",
	"com.google.guava" % "guava" % "15.0"
  )

  val main = play.Project(appName, appVersion, appDependencies).settings(
    resolvers += "Typesafe's Repository" at "http://repo.typesafe.com/typesafe/maven-releases"
  )

}
