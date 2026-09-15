const fs = require('fs');
const path = require('path');

// 1. env.ts
const envPath = path.join(__dirname, 'src/config/env.ts');
let envContent = fs.readFileSync(envPath, 'utf8');
if (!envContent.includes('RAZORPAY_KEY_ID: string;')) {
    envContent = envContent.replace(
        'jwtExpiresIn: string;',
        'jwtExpiresIn: string;\n  RAZORPAY_KEY_ID: string;\n  RAZORPAY_KEY_SECRET: string;\n  RAZORPAY_WEBHOOK_SECRET: string;'
    );
    fs.writeFileSync(envPath, envContent, 'utf8');
}

// 2. payment.routes.ts
const routesPath = path.join(__dirname, 'src/routes/payment.routes.ts');
let routesContent = fs.readFileSync(routesPath, 'utf8');
routesContent = routesContent.replace('../middlewares/auth.middleware', '../middleware/auth.middleware');
routesContent = routesContent.replace(/import { Router, Request, Response, NextFunction } from 'express';/, "import { Router } from 'express';");
routesContent = routesContent.replace(/import express from 'express';/, '');
fs.writeFileSync(routesPath, routesContent, 'utf8');

// 3. payment.service.ts
const servicePath = path.join(__dirname, 'src/services/payment.service.ts');
let serviceContent = fs.readFileSync(servicePath, 'utf8');
serviceContent = serviceContent.replace("import NotificationService from './notification.service';", "import { NotificationService } from './notification.service';");
serviceContent = serviceContent.replace("import Order, { IOrder, PaymentStatus } from '../models/order.model';", "import Order, { PaymentStatus } from '../models/order.model';");
serviceContent = serviceContent.replace("import Transaction, { ITransaction, TransactionStatus, TransactionType } from '../models/transaction.model';", "import Transaction, { TransactionStatus, TransactionType } from '../models/transaction.model';");
serviceContent = serviceContent.replace("import { Types } from 'mongoose';", "");
fs.writeFileSync(servicePath, serviceContent, 'utf8');

// 4. app.ts
const appPath = path.join(__dirname, 'src/app.ts');
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace('verify: (req, res, buf)', 'verify: (req, _res, buf)');
fs.writeFileSync(appPath, appContent, 'utf8');

console.log('Fixed TS issues in server');
