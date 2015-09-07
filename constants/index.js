module.exports = {
    DATE_REGEXP: /^(3[01]|[12][0-9]|0[1-9])\/(1[0-2]|0[1-9])\/[0-9]{4}$/,
    EMAIL_REGEXP: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    //BASE64_REGEXP:/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
    BASE64_REGEXP:/^data:([A-Za-z-+\/]+);base64,(.+)$/,
    PAGE_NOT_FOUND: 'Page Not Found',
    DEFAULT_AVATAR_URL: 'default.png',
    DEFAULT_LOGO_URL: 'default.png',
    DEFAULT_SUPERADMIN_ID: 1,
    DEFAULT_SUPERADMIN_EMAIL: 'mcinnescooper@legalapp.com',
    DEFAULT_SUPERADMIN_PASSWORD: '1q2w3e4r',
    DEFAULT_SUPERADMIN_FIRST_NAME: 'super',
    DEFAULT_SUPERADMIN_LAST_NAME: 'admin',
    DEFAULT_COMPANY_ID: 1,
    DEFAUlT_COMPANY_NAME: 'mcinnes cooper',
    DEFAULT_COMPANY_EMAIL: 'mcinnescooper@legalapp.com',
    DEFAULT_COMPANY_COUNTRY: 'USA',
    DEFAULT_COMPANY_CITY: 'New York',
    DEFAULT_COMPANY_ADDRESS: '31th Alley st.',
    DEFAULT_DOCUMENT_NAME: 'document',
    KEY_LENGTH: 122, //depends from user secret key and open key
    OPEN_KEY: 'ThisIsOpenKeyTo_OurDigitalSignature_ItsOk2015',
    SESSION_MAX_AGE: 3600000 //1 hour
};