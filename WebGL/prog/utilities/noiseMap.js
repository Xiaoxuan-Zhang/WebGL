/**
 * A class for generating noises.
 *
 * @author "Zhang Xiaoxuan"
 * @this {Noise}
 */
class NoiseMap {
  /**
   * Generate noise
   *
   * @param {String} noiseType Specify the noise type
   * @param {Array} samples Specify the noise size: [x,y]
   * @return {Array} noise array with the size specified in samples
   */
  noiseGeneration(noiseType, samples) {
    var noise;
    if (noiseType == "Perlin") {
      noise = randomNoise(samples);
    } else if (noiseType == "Random") {
      noise = perlinNoise(samples);
    }
    return noise;
  }
  /**
   * Generate random noise
   *
   * @param {Array} samples Specify the noise size: [x,y]
   * @return {Float} A value between 0 and 1
   */
  randomNoiseMap(samples) {
    var noiseArray = [];
    for (var i = 0; i < samples[0]; i++) {
      noiseArray[i] = [];
      for (var j = 0; j < samples[1]; j++) {
        noiseArray[i][j] = Math.random();
      }
    }
    return noiseArray;
  }

  perlinNoiseMap(samples) {
    var noiseArray = [];
    var width = samples[0];
    var height = samples[1];
    for (var i = 0; i < width; i++) {
      noiseArray[i] = [];
      for (var j = 0; j < height; j++) {
        noiseArray[i][j] = noise.perlin2(i/100,j/100);
      }
    }
    return noiseArray;
  }

}
