const regex = /(DASH:|Dash:|dash:)([\w]+)/;


const find = (content) => {
    return (`${content}`.match(regex) || [''])[0].split(':')[1] || '';
};


module.exports = { find };
