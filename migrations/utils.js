const fs = require('fs');
const _ = require('lodash');

const _fpath = './build/contract_addresses.json';

function _loadAddressData() {
    let fdata;
    try {
	fdata = fs.readFileSync(_fpath, 'utf8');
    } catch (x) {
	fdata = null;
    }

    return (_.isEmpty(fdata)) ? { } : JSON.parse(fdata);
};

function _saveAddress(contract, address) {
    let c_name = contract.contract_name;
    let c_network_id = contract.network_id;
    let c_network = _.merge({}, contract.network);

    let json = _loadAddressData();
    let j_data = json[c_name] || { };
    if (!_.isObject(j_data.networks)) j_data.networks = { };
    let j_networks = j_data.networks;

    if (c_network.address != address)
    {
	c_network.address = address;
	c_network.transactionHash = null;
    }

    j_networks[c_network_id] = c_network;
    json[c_name] = j_data;

    fs.writeFileSync(_fpath, JSON.stringify(json, null, 2), 'utf8');
};

module.exports = {
    loadAddressData: _loadAddressData,
    saveAddress: _saveAddress
};
