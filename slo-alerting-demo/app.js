"use strict";

// imports
const express = require ('express');
const app = express();
const { MeterProvider } = require('@opentelemetry/metrics');
const { MetricExporter } = require('@google-cloud/opentelemetry-cloud-monitoring-exporter');
const {gcpDetector} = require('@opentelemetry/resource-detector-gcp');

const ERROR_RATE = process.env.ERROR_RATE;

function sleep (n) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

const exporter = new MetricExporter();
const {meter, requestCount, errorCount} = async function(x) {
  let resource = await gcpDetector.detect()
  // return (resource, rc, ec)
    .then((resource) => {
      meter = new MeterProvider({
        exporter,
        interval: 60000,
        resource,
      }).getMeter('example-meter');
    })
    .then((meter) => {
      // define metrics 
      requestCount = meter.createCounter("request_count_sli", {
        description: "Counts total number of requests"
      });
      errorCount = meter.createCounter("error_count_sli", {
          description: "Counts total number of errors"
      });
      return (meter, requestCount, errorCount);
    })
};

// set metric values on request
app.get('/', (req, res) => {
    // start latency timer
    console.log('request made');
    // increment total requests counter
    requestCount.add(1);
    // return an error based on ERROR_RATE
    if ((Math.floor(Math.random() * 100)) <= ERROR_RATE) {
        // increment error counter
        errorCount.add(1);
        // return error code
        res.status(500).send("error!")
    } 
    // record latency and respond right away
    else {
      sleep(Math.floor(Math.random()*1000));
      res.status(200).send("success!")
    }
})

app.listen(8080, () => console.log(`Example app listening on port 8080!`))