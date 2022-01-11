const encode = (data) => {
    return Buffer.from(JSON.stringify(data)).toString("base64");
};

const decode = (data) => {
    return JSON.parse(Buffer.from(data, "base64").toString());
}

module.exports = {encode, decode};