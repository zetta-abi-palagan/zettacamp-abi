// *************** IMPORT LIBRARY ***************
const express = require('express');

const app = express();

app.listen(5000, () => {
    console.log('server running on port http://localhost:5000');
})