CREATE TABLE `product_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productInstanceId` int NOT NULL,
	`senderUserId` int NOT NULL,
	`receiverUserId` int,
	`shareToken` varchar(64) NOT NULL,
	`status` enum('pending','accepted','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `product_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_shares_shareToken_unique` UNIQUE(`shareToken`)
);
