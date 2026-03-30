/**
 * Runtime environment (aligned with aemsites/author-kit pattern).
 * @type {'prod' | 'stage' | 'dev'}
 */
export default (() => {
  const { host } = window.location;
  if (!['--', 'local'].some((check) => host.includes(check))) return 'prod';
  if (['--'].some((check) => host.includes(check))) return 'stage';
  return 'dev';
})();
