const tf = require('./index');

async function main() {
    const max_len = 4;
    const len = 8;
    let input = tf.input({ shape: [max_len, len] });
    let $ = tf.layers.flatten().apply(input);
    let $1 = tf.layers.dense({ name:"hi1", units: 2}).apply($);
    let $2 = tf.layers.dense({ name:"hi2", units: 2}).apply($);
    let $3 = tf.layers.dense({ name:"hi3", units: 2}).apply($);
    let model = tf.model({ inputs: [input], outputs: [ $1, $2, $3 ] });

    model.compile({
        loss: 'meanSquaredError',
        optimizer: 'adam',
        metrics: ['acc']
    });

    model.summary();

    const xTrain = tf.ones([48000, max_len, len]);
    const yTrain = tf.ones([48000, 2]);
    await model.fit(xTrain, [yTrain, yTrain, yTrain], {
        epochs: 10,
        batchSize: 8,
        validationSplit: 0.2,
    });
}

main();
