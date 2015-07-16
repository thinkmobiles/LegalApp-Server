module.exports = function () {
    var DEFAULT_ERROR_NAME = 'Error';
    var DEFAULT_ERROR_MESSAGE = 'error';
    var DEFAULT_ERROR_STATUS = 400;

    var NOT_ENAUGH_PARAMS = "Not enough incoming parameters.";
    var INVALID_EMAIL = "Invalid email address.";
    var EMAIL_IN_USE = 'Email in use. Please input another email address.';
    var NO_UPDATE_PARAMS = 'There are no params for update.';

    function Errors(options) {
        //http://j-query.blogspot.com/2014/03/custom-error-objects-in-javascript.html
        Error.captureStackTrace(this);

        if (options && options.name) {
            this.name = options.name;
        } else {
            this.name = DEFAULT_ERROR_NAME;
        }

        if (options && options.message) {
            this.message = options.message;
        } else {
            this.message = DEFAULT_ERROR_MESSAGE;
        }

        if (options && options.status) {
            this.status = options.status;
        } else {
            this.status = DEFAULT_ERROR_STATUS;
        }
    }

    Errors.prototype = Object.create(Error.prototype);

    function NotEnParams(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = "NotEnoughIncomingParameters";
        }

        if (!errOptions.message) {
            errOptions.message = NOT_ENAUGH_PARAMS;
        }
        if (options && options.reqParams) {
            errOptions.message += 'This parameters are required: ' + options.reqParams;
        }

        return new Errors(errOptions);
    }

    function InvalidEmail(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = "InvalidEmal";
        }
        if (!errOptions.message) {
            errOptions.message = INVALID_EMAIL;
        }

        return new Errors(errOptions);
    }

    function EmailInUse(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'DoubledEmail';
        }
        if (!errOptions.message) {
            errOptions.message = EMAIL_IN_USE;
        }

        return new Errors(errOptions);
    }

    function NoUpdateParams(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'NoUpdateParams';
        }
        if (!errOptions.message) {
            errOptions.message = NO_UPDATE_PARAMS;
        }

        return new Errors(errOptions);
    }

    function InvalidValue(options) {
        var errOptions;
        var errMessage;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'InvalidValue';
        }

        if (!errOptions.message) {
            errMessage = 'Invalid value';
            if (errOptions.value) {
                errMessage += " " + options.value;
            }
            if (errOptions.param) {
                errMessage += " for '" + options.param + "'";
            }
            errOptions.message = errMessage;
        }

        return new Errors(errOptions);
    }

    function UnknownDeviceOS(options) {
        var errOptions;
        var errMessage;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'UnknownDeviceOS';
        }

        if (!errOptions.message) {
            errMessage = 'Unknown device OS';
            errOptions.message = errMessage;
        }

        return new Errors(errOptions);
    }

    function NotFound(options) {
        var errOptions;
        var errMessage;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'NotFound';
        }
        if (!errOptions.message) {
            errMessage = "Not Found";
            if (errOptions.target) {
                errMessage += " " + errOptions.target;
            }
            if (errOptions.searchParams) {
                errMessage += " (" + errOptions.searchParams + ")";
            }
            errOptions.message = errMessage;
        }

        return new Errors(errOptions);
    }

    function UnconfirmedEmail(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'UnconfirmedEmail';
        }
        if (!errOptions.message) {
            errOptions.message = 'You need to verify your account using the link in the email we sent you.';
        }
        if (!errOptions.status) {
            errOptions.status = 400;
        }

        return new Errors(errOptions);
    }

    function SignInError(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'SignInError';
        }
        if (!errOptions.message) {
            errOptions.message = 'Incorrect email or password';
        }
        if (!errOptions.status) {
            errOptions.status = 400;
        }

        return new Errors(errOptions);
    }

    function BlockedAccount(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'BlockedAccount';
        }
        if (!errOptions.message) {
            errOptions.message = "Your account was blocked!";
        }

        return new Errors(errOptions);
    }

    function AccessError(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'AccessError';
        }
        if (!errOptions.message) {
            errOptions.message = 'You do not have sufficient rights';
        }

        return new Errors(errOptions);
    }

    function VoteTimeOutError(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'VoteTimeOutError';
        }
        if (!errOptions.message) {
            errOptions.message = 'Passed the vote time';
        }

        return new Errors(errOptions);
    }

    function InvalidType(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'InvalidType';
        }
        if (!errOptions.message) {
            errOptions.message = "Invalid type of variable";
        }

        return new Errors(errOptions);
    }

    function BannError(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'BannedAccount';
        }
        if (!errOptions.message) {
            errOptions.message = "You banned";
        }

        return new Errors(errOptions);
    }

    function ImageLimitError(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'ImageLimitAchived';
        }
        if (!errOptions.message) {
            errOptions.message = 'You can\'t add more images';
        }
        if (!errOptions.status) {
            errOptions.status = 400;
        }

        return new Errors(errOptions);
    }

    function PreviouslyFlagged (options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'PreviouslyFlagged';
        }
        if (!errOptions.message) {
            errOptions.message = 'You can\'t make this operation twice with the same object';
        }
        if (!errOptions.status) {
            errOptions.status = 400;
        }

        return new Errors(errOptions);
    }

    return {
        NotEnParams: NotEnParams,
        InvalidEmail: InvalidEmail,
        EmailInUse: EmailInUse,
        NoUpdateParams: NoUpdateParams,
        InvalidValue: InvalidValue,
        NotFound: NotFound,
        UnconfirmedEmail: UnconfirmedEmail,
        SignInError: SignInError,
        AccessError: AccessError,
        VoteTimeOutError: VoteTimeOutError,
        InvalidType: InvalidType,
        BannError: BannError,
        ImageLimitError: ImageLimitError,
        BlockedAccount: BlockedAccount,
        PreviouslyFlagged: PreviouslyFlagged,
        UnknownDeviceOS: UnknownDeviceOS
    }
};