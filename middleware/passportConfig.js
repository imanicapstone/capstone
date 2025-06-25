const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bycrypt');
const prisma = require('../prisma/client');

passport.use(new LocalStrategy)