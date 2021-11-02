var express = require('express');
var router = express.Router();
const axios = require('axios').default;
const dotnetFQDN = process.env.DOTNET_FQDN;

/* GET users listing. */
router.get('/', async  function(req, res, next) {
  // Even though we use the FQDN, because both containers are in the 
  // same environment, traffic will not leave the environment.
  var data = await axios.get(`http://${dotnetFQDN}`);
  res.send(`${JSON.stringify(data.data)}`);
});

module.exports = router;
