var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var userSchema = Schema({
    userName: { type: String, required: 'username required' },
    email: {
        type: String,
        unique: 'unique email required',
        required: 'email required',
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],

    },
    password: { type: String, required: 'password required' },
    userType: { type: String, required: 'user type required' },
    token: { type: String }
});
const Foo = mongoose.model('User', userSchema);

Foo.createIndexes();

module.exports = Foo;
