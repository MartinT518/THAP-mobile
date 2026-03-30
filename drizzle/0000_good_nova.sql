CREATE TABLE `ai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int,
	`provider` varchar(50) NOT NULL,
	`messages` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_provider_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(50) NOT NULL,
	`apiKey` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_provider_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productInstanceId` int NOT NULL,
	`userId` int NOT NULL,
	`documentType` varchar(50) NOT NULL,
	`title` varchar(255),
	`fileUrl` text,
	`fileKey` varchar(500),
	`mimeType` varchar(100),
	`textContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_instances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`nickname` varchar(255),
	`purchaseDate` timestamp,
	`purchasePrice` int,
	`purchaseLocation` varchar(255),
	`warrantyExpiry` timestamp,
	`notes` text,
	`tags` json,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_instances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(255) NOT NULL,
	`name` text NOT NULL,
	`brand` varchar(255),
	`model` varchar(255),
	`category` varchar(100),
	`imageUrl` text,
	`barcode` varchar(100),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_productId_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `scan_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`scannedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scan_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`languageCode` varchar(10) DEFAULT 'en',
	`countryCode` varchar(10),
	`postalCode` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
