import ow from "ow";

export default ow.object.exactShape({
  token: ow.string.nonEmpty,
  prefix: ow.string.nonEmpty,
  minimumWordLength: ow.number.greaterThan(0),
});
