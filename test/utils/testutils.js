var _ = require("lodash");

function _buildEventSignature(desc) {
    var signature = "{event: " + desc.event;
    if (desc.args) {
	signature += ', args: {' + _(desc.args)
	    .reduce(function(r, v, k) {
			r.push('' + k + ': ' + v);
			return r;
		    }, [])
	    .join(', ');

	signature += '}';
    }
    signature += '}';
    return signature;
}

function _unwrapValue(v) {
    if (_.isObject(v)) {
	if (_.isFunction(v.toNumber)) {
	    return v.toNumber();
	} else if (_.isFunction(v.valueOf)) {
	    return v.valueOf();
	}
    }
    return v;
}

function _didLogEvent(r, desc, msg) {
    this.isObject(desc, 'didLogEvent requires a descriptor');
    this.isString(desc.event, 'didLogEvent requires the :event parameter');

    var logs = r.logs;
    for (var i=0; i < logs.length; i++) {
	var log = logs[i];
	if (log.event == desc.event) {
	    if (!desc.args) {
		return;
	    }

	    // we can't assert an object comparison, because desc.args may be underspecified.
	    // And also, we (probably anally retentive) consider the possibility that more than one
	    // event of a given type was triggered

	    for (var ak in desc.args) {
		if (!log.args[ak] || (_unwrapValue(log.args[ak]) != desc.args[ak])) {
		    continue;
		}
	    }

	    // if we made it here, all checks worked

	    return;
	}
    }

    this(false, msg);
}

function _filterEvents(r, desc) {
    return _.filter(r.logs, function(log, idx) {
			if (log.event == desc.event) {
			    if (!desc.args) {
				return true;
			    }

			    for (var ak in desc.args) {
				if (!log.args[ak] || (_unwrapValue(log.args[ak]) != desc.args[ak])) {
				    return false;
				}
			    }

			    return true;
			}

			return false;
		    });
}

function _didRevertTransaction(r, msg) {
    if (_.isObject(r))
    {
	if (!_.isUndefined(r.name) && (r.name == 'StatusError'))
	{
	    // This was a transaction that completed, but with a status of 0 (failure).
	    // To double check, see if it has a :receipt property

	    if (_.isObject(r.receipt)) return;
	}
	else if (_.isString(r.message))
	{
	    // OK, and this was a rejected transaction

	    this.match(r.message, /VM Exception[a-zA-Z0-9 ]+: revert/, msg);
	    return;
	}

	this(false, 'unexpected transaction result (' + r.toString() + ') in: ' + msg);
    }
    else if (_.isString(r))
    {
	this.match(r, /VM Exception[a-zA-Z0-9 ]+: revert/, msg);
    }
    else
    {
	this(false, 'unexpected transaction result (' + r.toString() + ') in: ' + msg);
    }
}

module.exports = {
    injectAsserts: function(assert) {
	assert.didLogEvent = _didLogEvent.bind(assert);
	assert.didRevertTransaction = _didRevertTransaction.bind(assert);
    },

    mustHaveEvent: function(r, desc) {
	assert.isObject(desc, 'mustHaveEvent requires a descriptor');
	assert.isString(desc.event, 'mustHaveEvent requires the :event parameter');

	var logs = r.logs;
	for (var i=0; i < logs.length; i++) {
	    var log = logs[i];
	    if (log.event == desc.event) {
		if (!desc.args) {
		    return;
		}

		// we can't assert an object comparison, because desc.args may be underspecified.
		// And also, we (probably anally retentive) consider the possibility that more than one
		// event of a given type was triggered

		for (var ak in desc.args) {
		    if (!log.args[ak] || (_unwrapValue(log.args[ak]) != desc.args[ak])) {
			continue;
		    }
		}

		// if we made it here, all checks worked

		return;
	    }
	}

	assert(false, 'missing required event ' + _buildEventSignature(desc));
    },

    filterEvents: function(r, desc) {
	return _filterEvents(r, desc);
    },

    filterOwner: function(accounts, owner) {
	return _.reject(accounts, function(e) { return (e == owner); });
    }
};
