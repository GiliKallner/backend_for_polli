'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _lodash = require('lodash');

var _poll = require('../models/poll');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

var validateInput = function validateInput(_ref) {
    var question = _ref.question,
        options = _ref.options;


    var errors = {};

    if (question && (0, _lodash.isEmpty)(question)) errors.question = 'A question is requiered to start a poll';
    if (options.length < 2) errors.options = 'Polls need at list two options to vote from.';
    if (question) question = question.match(/\?$|!$|\.$/g) ? question : question + '?';

    return {
        errors: errors,
        isValid: (0, _lodash.isEmpty)(errors),
        question: question
    };
};

/*-------------------------------------------------------*/
// delete a poll

router.delete('/:pollId', function (req, res) {
    var callback = function callback(err) {
        if (err) return res.status(500).json('Something went wrong');
        res.status(200).json(req.params.pollId);
    };

    _poll.Poll.deletePoll(req.params.pollId, callback);
});

/*-------------------------------------------------------*/
// retrive user's polls

router.get('/:userId', function (req, res) {
    var callback = function callback(err, polls) {
        if (err) return res.status(404).json('There are no polls yet in your repository');
        return res.status(200).json(polls);
    };

    _poll.Poll.getUsersPolls(req.params.userId, callback);
});

/*-------------------------------------------------------*/
// get a single poll by it's id

router.get('/poll/:pollId', function (req, res) {
    var pollId = req.params.pollId;


    var callback = function callback(err, poll) {
        if (err) return res.status(500).json('Something went wrong');
        return res.status(200).json(poll);
    };

    _poll.Poll.getPollById(pollId, callback);
});

/*-------------------------------------------------------*/
// vote for a single option in a poll
router.put('/vote', function (req, res) {
    var _req$body = req.body,
        _id = _req$body._id,
        opt_id = _req$body.opt_id;


    var callback = function callback(err, poll) {
        if (err) return res.status(500).json(err);
        res.status(200).json({ _id: _id, opt_id: opt_id });
    };

    _poll.Poll.vote(_id, opt_id, callback);
});

/*-------------------------------------------------------*/
// update a single poll

router.put('/', function (req, res) {
    var _validateInput = validateInput(req.body),
        errors = _validateInput.errors,
        isValid = _validateInput.isValid,
        question = _validateInput.question;

    if (!isValid) return res.status(401).json(errors);

    var _req$body2 = req.body,
        options = _req$body2.options,
        poll_id = _req$body2.poll_id;


    options = options.map(function (opt) {
        if ((typeof opt === 'undefined' ? 'undefined' : _typeof(opt)) === 'object') return { option: opt.option, votes: opt.votes };
        return { option: opt };
    });

    var callback = function callback(poll, err) {
        if (err) {
            console.log('update-error: ', err);
            return res.status(500).json(errors);
        }
        console.log('updated- poll: ', poll);
        res.status(200).json(poll);
    };

    _poll.Poll.updatePoll({ question: question, options: options }, poll_id, callback);
});

/*-------------------------------------------------------*/
// save a new poll

router.post('/', function (req, res) {
    var _validateInput2 = validateInput(req.body),
        errors = _validateInput2.errors,
        isValid = _validateInput2.isValid,
        question = _validateInput2.question;

    if (!isValid) return res.status(401).json(errors);

    var _req$body3 = req.body,
        options = _req$body3.options,
        user_id = _req$body3.user_id;


    options = options.map(function (opt) {
        return { option: opt };
    });

    var callback = function callback(err, poll) {
        if (err) return res.status(401).json('User is not logged in');
        res.status(200).json(poll);
    };

    _poll.Poll.saveNewPoll({ question: question, options: options, user_id: user_id }, callback);
});

/*-------------------------------------------------------*/
// home page - view all polls filtered by a given category

router.get('/', function (req, res) {
    var callback = function callback(err, polls) {
        if (err) {
            console.log('err: ', err);return res.status(500).json('Something went wrong');
        };
        polls = polls.map(function (poll) {
            poll.owner = poll.owner.username;
            return poll;
        });
        res.status(200).json(polls);
    };

    var type = { 'all': 'getAllPolls',
        'most-recent': 'getRecentPolls',
        'most-popular': 'getMostPopularPolls'
    }[req.query.type];

    _poll.Poll[type](callback);
});

exports.default = router;