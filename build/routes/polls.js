import express from 'express';
import { isEmpty } from 'lodash';

import { Poll } from '../models/poll';

let router = express.Router();

const validateInput = ({ question, options }) => {

    let errors = {};

    if (question && isEmpty(question)) errors.question = 'A question is requiered to start a poll';
    if (options.length < 2) errors.options = 'Polls need at list two options to vote from.';
    if (question) question = question.match(/\?$|!$|\.$/g) ? question : question + '?';

    return {
        errors,
        isValid: isEmpty(errors),
        question
    };
};

/*-------------------------------------------------------*/
// delete a poll

router.delete('/:pollId', (req, res) => {
    const callback = err => {
        if (err) return res.status(500).json('Something went wrong');
        res.status(200).json(req.params.pollId);
    };

    Poll.deletePoll(req.params.pollId, callback);
});

/*-------------------------------------------------------*/
// retrive user's polls

router.get('/:userId', (req, res) => {
    const callback = (err, polls) => {
        if (err) return res.status(404).json('There are no polls yet in your repository');
        return res.status(200).json(polls);
    };

    Poll.getUsersPolls(req.params.userId, callback);
});

/*-------------------------------------------------------*/
// get a single poll by it's id

router.get('/poll/:pollId', (req, res) => {

    const { pollId } = req.params;

    const callback = (err, poll) => {
        if (err) return res.status(500).json('Something went wrong');
        return res.status(200).json(poll);
    };

    Poll.getPollById(pollId, callback);
});

/*-------------------------------------------------------*/
// vote for a single option in a poll
router.put('/vote', (req, res) => {

    const { _id, opt_id } = req.body;

    const callback = (err, poll) => {
        if (err) return res.status(500).json(err);
        res.status(200).json({ _id, opt_id });
    };

    Poll.vote(_id, opt_id, callback);
});

/*-------------------------------------------------------*/
// update a single poll

router.put('/', (req, res) => {
    let { errors, isValid, question } = validateInput(req.body);

    if (!isValid) return res.status(401).json(errors);

    let { options, poll_id } = req.body;

    options = options.map(opt => {
        if (typeof opt === 'object') return { option: opt.option, votes: opt.votes };
        return { option: opt };
    });

    const callback = (poll, err) => {
        if (err) {
            console.log('update-error: ', err);
            return res.status(500).json(errors);
        }
        console.log('updated- poll: ', poll);
        res.status(200).json(poll);
    };

    Poll.updatePoll({ question, options }, poll_id, callback);
});

/*-------------------------------------------------------*/
// save a new poll

router.post('/', (req, res) => {
    const { errors, isValid, question } = validateInput(req.body);
    if (!isValid) return res.status(401).json(errors);

    let { options, user_id } = req.body;

    options = options.map(opt => {
        return { option: opt };
    });

    const callback = (err, poll) => {
        if (err) return res.status(401).json('User is not logged in');
        res.status(200).json(poll);
    };

    Poll.saveNewPoll({ question, options, user_id }, callback);
});

/*-------------------------------------------------------*/
// home page - view all polls filtered by a given category

router.get('/', (req, res) => {
    const callback = (err, polls) => {
        if (err) {
            console.log('err: ', err);return res.status(500).json('Something went wrong');
        };
        polls = polls.map(poll => {
            poll.owner = poll.owner.username;
            return poll;
        });
        res.status(200).json(polls);
    };

    const type = { 'all': 'getAllPolls',
        'most-recent': 'getRecentPolls',
        'most-popular': 'getMostPopularPolls'
    }[req.query.type];

    Poll[type](callback);
});

export default router;
//# sourceMappingURL=polls.js.map