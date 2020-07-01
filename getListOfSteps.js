'use strict';

const path = require('path'),
  fs = require('fs'),
  Handlebars = require('handlebars'),
  root = path.resolve(path.join(__dirname, '../')),
  featuresPath = path.join(root, './features/'),
  stepsPath = path.resolve(root, './step_definitions/'),
  REGEX = /.+[Given|When|Then|And|But]\(\/\^(?<step>.+)\$\/?.+/,
  HTML_TEMPLATE = 'templateHTML.html',
  HTML_RESULT = 'implementedStepDefinitions.html',
  HTML_FOLDER = 'HTMLFiles';

async function getArrayOfFiles (path, files_) {
  files_ = files_ || [];
  let files = fs.readdirSync(path);
  for (let i in files) {
    let name = path + '/' + files[i];
    if (fs.statSync(name).isDirectory()) {
      await getArrayOfFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
}

async function getArrayOfSteps (arrayOfStepsFiles) {
  let arrayOfSteps = [];
  for (let file of arrayOfStepsFiles) {
    let data = await fs.readFileSync(path.resolve(file), 'utf-8');
    let strs = data.split('\n');
    strs.forEach(str => {
      if (str.match(REGEX)) {
        arrayOfSteps.push(str.match(REGEX).groups.step);
      }
    });
  }
  return arrayOfSteps;
}

async function getArrayOfStepExamples (arrayOfSteps, arrayOfFeatureFiles) {
  let arrayOfStepsObjects = [];

  for (let el of arrayOfSteps) {
    let setOfExamples = new Set();
    for (let file of arrayOfFeatureFiles) {
      let featureFile = fs.readFileSync(path.resolve(file), 'utf-8');
      let arrayOfLineOfTheFeatureFile = featureFile.split('\n');

      arrayOfLineOfTheFeatureFile.forEach(str => {
        if (str.match(el)) {
          setOfExamples.add(str.match(el)[0]);
        }
      });

    }
    arrayOfStepsObjects.push({ 'name': el, 'value': Array.from(setOfExamples) });
  }
  return arrayOfStepsObjects;
}

async function createHTMLImplementationSteps (featuresPath, stepsPath) {
  let arrayOfFeatureFiles = await getArrayOfFiles(featuresPath),
    arrayOfStepsFiles = await getArrayOfFiles(stepsPath),
    arrayOfSteps = await getArrayOfSteps(arrayOfStepsFiles),
    objectOfExamples = await getArrayOfStepExamples(arrayOfSteps, arrayOfFeatureFiles);

  let source = fs.readFileSync(path.join(__dirname, './', HTML_FOLDER, HTML_TEMPLATE), { encoding: 'utf-8' }),
    template = Handlebars.compile(source),
    result = template({ 'steps': objectOfExamples });

  await fs.writeFile(path.join(__dirname, './', HTML_FOLDER, HTML_RESULT), result, err => {
    if (err) {
      throw new Error(err.message);
    }
  });

}

createHTMLImplementationSteps(featuresPath, stepsPath).catch(err => new Error(err));