process.env.HOST = 'http://localhost:8851';
process.env.PORT = '8851';

process.env.RDS_HOSTNAME = '192.168.88.250';
process.env.RDS_USERNAME = 'postgres';
process.env.RDS_PASSWORD = 'postgres';
process.env.RDS_PORT = 5432;
process.env.DATABASE = 'legal_app_test';

process.env.mailerService = 'SendGrid';
process.env.mailerUserName = '';
process.env.mailerPassword = '';

process.env.REDIS_HOST = '134.249.164.53';
process.env.REDIS_PORT = '6379';
process.env.REDIS_DB_KEY = '10';

process.env.UPLOADER_TYPE = 'FileSystem';
process.env.AMAZON_S3_BUCKET = 'public/uploads/' + process.env.NODE_ENV.toLowerCase();
