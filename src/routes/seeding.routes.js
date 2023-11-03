const router = require('express').Router();
const {roleseeding, emailTemplateseeding} = require('../seeding/seeding');

router.get('/roleSeeding', roleseeding);
router.get('/emailSeeding', emailTemplateseeding);

module.exports = router;
