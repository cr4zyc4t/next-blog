CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"slug" varchar(220) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" varchar(500) DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"author_name" varchar(100) NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"publish_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_posts_visible" ON "posts" USING btree ("published","publish_time");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_posts_slug" ON "posts" USING btree ("slug");