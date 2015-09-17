//process.env.HOST = 'http://134.249.164.53:8850';
process.env.HOST = 'http://localhost:8850';
process.env.PORT = '8850';
process.env.RDS_HOSTNAME = '192.168.88.250';
//process.env.RDS_HOSTNAME = 'localhost';
process.env.RDS_USERNAME = 'postgres';
process.env.RDS_PASSWORD = 'postgres';
process.env.RDS_PORT = 5432;
process.env.DATABASE = 'legal_app_dev';

process.env.mailerService = 'SendGrid';
process.env.mailerUserName = 'istvan.nazarovits';
process.env.mailerPassword = 'sendGridpassw365';

process.env.REDIS_HOST = '134.249.164.53';
//process.env.REDIS_HOST = '192.168.88.154';
process.env.REDIS_PORT = '6379';
process.env.REDIS_DB_KEY = '11';

process.env.UPLOADER_TYPE = 'FileSystem';
process.env.AMAZON_S3_BUCKET = '/public/uploads/' + process.env.NODE_ENV.toLowerCase();
