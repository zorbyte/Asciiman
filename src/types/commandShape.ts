import ow from "ow";

export default ow.object.exactShape({
  aliases: ow.optional.array.ofType(ow.string),
  information: ow.string,
  usage: ow.string,
  exec: ow.function,
});
