const apiPath = 'https://api.zsq.im/live2d';


export async function getNextCharacter(value = '0-0') {
  const m = value.split('-')[0];
  const response = await fetch(`${apiPath}/rand/?id=${m}`);
  const data = await response.json();
  return `${data.model.id}-0`;
}

export async function getNextTexture(value = '0-0') {
  const m = value.split('-')[0];
  const response = await fetch(`${apiPath}/rand_textures/?id=${value}`);
  const data = await response.json();
  return `${m}-${data.textures.id}`;
}
