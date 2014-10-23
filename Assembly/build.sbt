import sbt._
import Keys._
import play.Play.autoImport._
import PlayKeys._

name := "Assembly"

version := "1.0-SNAPSHOT"

lazy val root = (project in file(".")).enablePlugins(PlayJava)

scalaVersion := "2.11.1"

libraryDependencies ++= Seq(
	javaJdbc, filters,
	"mysql" % "mysql-connector-java" % "5.1.31",
	"commons-io" % "commons-io" % "2.4",
	"commons-lang" % "commons-lang" % "2.6",
	"com.mchange" % "c3p0" % "0.9.2.1",
	"org.jsoup" % "jsoup" % "1.7.2",
	"commons-dbutils" % "commons-dbutils" % "1.5",
	"com.google.guava" % "guava" % "18.0",
	"org.apache.commons" % "commons-math3" % "3.2",
	"com.fasterxml.jackson.core" % "jackson-core" % "2.3.0",
	"com.fasterxml.jackson.core" % "jackson-annotations" % "2.3.0",
	"com.fasterxml.jackson.core" % "jackson-databind" % "2.3.0",
	"net.sourceforge" % "jwbf" % "2.0.0",
	"com.rabbitmq" % "amqp-client" % "3.3.1",
	"org.mongodb" % "mongo-java-driver" % "2.12.2",
	"net.schmizz" % "sshj" % "0.9.0"
  )
