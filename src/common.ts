function transformValue(obj) {
  const { type, options, value } = obj;
  if (type === 'string' || type === 'array') {
    return `'${value}'`;
  } else if (type === 'boolean') {
    return `${value}`;
  } else if (type === 'list') {
    let arr = options.map((key) => {
      return {
        label: key,
        key,
      };
    });
    return JSON.stringify(arr);
  }
}
export { transformValue };
