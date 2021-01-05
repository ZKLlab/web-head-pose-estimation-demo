import opencv from 'opencv';


function getPoints(landmarks) {
  return [
    landmarks[30].x, landmarks[30].y, // nose tip
    landmarks[8].x, landmarks[8].y,   // chin
    landmarks[36].x, landmarks[36].y, // left corner of left eye
    landmarks[45].x, landmarks[45].y, // right corner of right eye
    landmarks[48].x, landmarks[48].y, // left corner of mouth
    landmarks[54].x, landmarks[54].y, // right corner of mouth
  ];
}

export async function estimatePose(positions, width, height) {
  const cv = await opencv;
  const imagePoints = cv.matFromArray(6, 2, cv.CV_64FC1, getPoints(positions));
  const modelPoints = cv.matFromArray(6, 3, cv.CV_64FC1, [
    0, 0, 0,
    0, -330, -65,
    -165, 170, -135,
    165, 170, -135,
    -150, -150, -125,
    150, -150, -125,
  ]);
  const cameraMatrix = cv.matFromArray(3, 3, cv.CV_64FC1, [
    width, 0, width / 2,
    0, width, height / 2,
    0, 0, 1,
  ]);
  const distCoeffs = cv.Mat.zeros(4, 1, cv.CV_64FC1);
  const rotationVector = cv.Mat.zeros(1, 3, cv.CV_64FC1);
  const translationVector = cv.Mat.zeros(1, 3, cv.CV_64FC1);
  cv.solvePnP(modelPoints, imagePoints, cameraMatrix, distCoeffs, rotationVector, translationVector);
  const rotationVectorMatrix = cv.Mat.zeros(3, 3, cv.CV_64FC1);
  cv.Rodrigues(rotationVector, rotationVectorMatrix);
  const matVector = new cv.MatVector();
  matVector.push_back(rotationVectorMatrix);
  matVector.push_back(translationVector);
  const projectMatrix = cv.Mat.zeros(3, 4, cv.CV_64FC1);
  cv.hconcat(matVector, projectMatrix);
  const noArray0 = cv.Mat.zeros(0, 0, cv.CV_64FC1);
  const noArray1 = cv.Mat.zeros(0, 0, cv.CV_64FC1);
  const noArray2 = cv.Mat.zeros(0, 0, cv.CV_64FC1);
  const noArray3 = cv.Mat.zeros(0, 0, cv.CV_64FC1);
  const noArray4 = cv.Mat.zeros(0, 0, cv.CV_64FC1);
  const noArray5 = cv.Mat.zeros(0, 0, cv.CV_64FC1);
  const eulerAngles = cv.Mat.zeros(1, 3, cv.CV_64FC1);
  cv.decomposeProjectionMatrix(projectMatrix, noArray0, noArray1, noArray2, noArray3, noArray4, noArray5, eulerAngles);
  const [yaw, pitch] = eulerAngles.data64F.map(degree => Math.asin(Math.sin(degree / 180 * Math.PI)));
  imagePoints.delete();
  modelPoints.delete();
  cameraMatrix.delete();
  distCoeffs.delete();
  rotationVector.delete();
  translationVector.delete();
  rotationVectorMatrix.delete();
  projectMatrix.delete();
  matVector.delete();
  noArray0.delete();
  noArray1.delete();
  noArray2.delete();
  noArray3.delete();
  noArray4.delete();
  noArray5.delete();
  eulerAngles.delete();
  return { pitch, yaw };
}
