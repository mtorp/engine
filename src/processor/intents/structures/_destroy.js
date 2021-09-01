const _ = require('lodash'),
    utils = require('../../../utils'),
    driver = utils.getDriver(),
    C = driver.constants;

module.exports = function(object, scope, attackType) {
    const {gameTime, bulk, roomObjects} = scope;

    if(object.type == 'spawn' && object.spawning) {
        const spawning = _.find(roomObjects, {user: object.user, name: object.spawning.name});
        if(spawning) {
            bulk.remove(spawning._id);
            delete roomObjects[spawning._id];
        }
    }

    if(object.type == 'invaderCore') {
        require('../invader-core/destroy')(object, scope);
    }

    if(!attackType || attackType != C.EVENT_ATTACK_TYPE_NUKE) {
        const ruin = {
            type: 'ruin',
            room: object.room,
            x: object.x,
            y: object.y,
            structure: {
                id: object._id.toString(),
                type: object.type,
                hits: 0,
                hitsMax: object.hitsMax,
                user: object.user
            },
            destroyTime: gameTime,
            decayTime: gameTime + (C.RUIN_DECAY_STRUCTURES[object.type] || C.RUIN_DECAY)
        };
        if(object.user) {
            ruin.user = object.user
        }
        ruin.store = object.store || {};

        if(object.effects) {
            const collapseEffect = _.find(object.effects, {effect: C.EFFECT_COLLAPSE_TIMER});
            if(collapseEffect) {
                ruin.decayTime = (_.max([ruin.decayTime, collapseEffect.endTime]) || -Infinity);
            }
        }

        bulk.insert(ruin);
    }

    bulk.remove(object._id);
    delete roomObjects[object._id];
};
