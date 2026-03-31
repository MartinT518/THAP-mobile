CREATE TABLE `brand_feed_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandKey` varchar(255) NOT NULL,
	`kind` enum('news','commercial') NOT NULL,
	`title` varchar(500) NOT NULL,
	`summary` text NOT NULL,
	`imageUrl` text,
	`linkUrl` varchar(2000),
	`publishedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brand_feed_items_id` PRIMARY KEY(`id`)
);
