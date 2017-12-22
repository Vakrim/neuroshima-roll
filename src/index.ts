import { Observable } from '@reactivex/rxjs'
import { Chart, ChartData, ChartConfiguration, ChartOptions } from 'chart.js';

type Dices = [number, number, number];

function* threeDices() {
  for(let a = 1; a <= 20; a++)
    for(let b = 1; b <= 20; b++)
      for(let c = 1; c <= 20; c++)
        yield<Dices> [a, b, c]
}

// https://github.com/ReactiveX/rxjs/issues/2306#issuecomment-340285232
const observableFromIterable = <T>(iterable: Iterable<T>): Observable<T> => {
  return Observable.from(iterable as any)
}

type DifficultyLevels = {
  easy: number,
  medicore: number,
  problematic: number,
  hard: number,
  veryHard: number,
  damnHard: number,
  lucky: number,
}

const difficultyLevels: DifficultyLevels =  {
  easy: 2,
  medicore: 0,
  problematic: -2,
  hard: -5,
  veryHard: -8,
  damnHard: -11,
  lucky: -15
}

type DifficultyName = keyof DifficultyLevels;

const difficultiesNames = <DifficultyName[]>Object.keys(difficultyLevels);

const changeDifficultyIndexByDices = (startingDifficultyIndex: number, dices: Dices) =>
  dices.reduce((difficultyIndex, dice) => {
    switch(dice) {
      case 1:
        return difficultyIndex - 1;
      case 20:
        return difficultyIndex + 1;
      default:
        return difficultyIndex;
    }
  }, startingDifficultyIndex);

const changeDifficultyIndexBySill = (startingDifficultyIndex: number, skill: number) => {
  if(skill < 1) {
    return startingDifficultyIndex + 1;
  } else {
    return startingDifficultyIndex - skill % 4;
  }
}

const normalizeDifficultyIndex = (difficultyIndex: number) => {
  if(difficultyIndex < 0) {
    return 0;
  } else if(difficultyIndex > difficultiesNames.length) {
    return difficultiesNames.length;
  }
  return difficultyIndex;
}

const covertIndexToDifficultyLevel = (difficultyIndex: number) => difficultyLevels[difficultiesNames[difficultyIndex]];

const getDifficultyLevel = (startingDifficultyIndex: number, dices: Dices, skill: number) =>
  [
    (x: number) => changeDifficultyIndexByDices(x, dices),
    (x: number) => changeDifficultyIndexBySill(x, skill),
    normalizeDifficultyIndex,
    covertIndexToDifficultyLevel
  ].reduce((x, fn) => fn(x), startingDifficultyIndex)

const testSkill = (skill: number, attribute: number, difficultyName: DifficultyName) => {
  observableFromIterable(threeDices())
    .map(dices => {
      const difficultyIndex = difficultiesNames.indexOf(difficultyName);
      const difficultyLevel = getDifficultyLevel(difficultyIndex, dices, skill);
      const sumOfSmallerDices = dices.reduce((s, x) => s + x, 0) - Math.max(...dices);
      const successPoints = (attribute + difficultyLevel) * 2 + skill - sumOfSmallerDices ;
      return '' + successPoints;
    })
    .reduce((res: {[x: string]: number}, success) => ({...res, [success]: (res[success] || 0) + 1}), {})
    .subscribe(render)
}

const render = (results: {[x: string]: number}) => {
  console.log(results);
  const data = [];

  for(const x in results) {
    data.push({x: parseInt(x), y: results[x] / (20 * 20 * 20)})
  }

  console.log(data);

  new Chart('myChart', {
      type: 'scatter',
      data: {
        labels: ['xd'],
        datasets: [{
          data: data,
        }],
      },
      options: <ChartOptions>{}
  });
}

testSkill(1, 12, 'medicore');

declare global {
  interface Window { testSkill: any; }
}

window.testSkill = testSkill;
