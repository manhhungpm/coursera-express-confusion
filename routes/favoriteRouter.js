const express = require('express');
const bodyParser = require('body-parser');
var authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');
const Dishes = require("../models/dishes");

const favoritesRouter = express.Router();

favoritesRouter.use(bodyParser.json());

favoritesRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({user: req.user.id})
            .populate('dishes')
            .populate('user')
            .then((favor) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favor);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

        Favorites.findOne({user: req.user.id}, function (err,favorities){
            if (err) throw err;

            var arrDishId = req.body.map(function (item) {
                return item._id
            })

            if (favorities != null){

                arrDishId.map(function (item) {
                    if (favorities.dishes.indexOf(item) > -1){
                        var err = new Error('This recipe is already in your favorite list');
                        err.status = 401;
                        return next(err);
                    } else {
                        favorities.dishes.push(item)

                        favorities.save().then((favor) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favor);
                        }, (err) => next(err));
                    }
                })

            } else {
                //user ko co list favorites

                var favor = new Favorites({
                    user: req.user.id,
                    dishes: arrDishId
                })
                favor.save().then((dish) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(dish);
                }, (err) => next(err));

            }
        })


    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.deleteOne({
            user: req.user.id
        }).then((favorites) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites);
        })

    });


favoritesRouter.route('/:itemId')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({user: req.user.id}, function (err, favorities) {
            if (err) throw err;
            if (favorities != null) {

                if (favorities.dishes.indexOf(req.params.itemId) > -1) {
                    err = new Error('Favorite have ' + req.params.itemId + ' in list');
                    err.status = 404;
                    return next(err);
                } else {
                    favorities.dishes.push(req.params.itemId)

                    favorities.save().then((favor) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favor);
                    }, (err) => next(err));
                }
            } else {
                //user ko co list favorites
                var favor = new Favorites({
                    user: req.user.id,
                    dishes: req.params.itemId
                })

                favor.save().then((item) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(item);
                }, (err) => next(err));
            }
        })

    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({user: req.user.id}, function (err, favorities) {
            if (err) throw err;

            if (favorities != null){
                var index = favorities.dishes.indexOf(req.params.itemId);

                if (index > -1) {
                    favorities.dishes.splice(index, 1);
                }

                favorities.save().then((item) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(item);
                }, (err) => next(err));

            }
        })
    });

module.exports = favoritesRouter;