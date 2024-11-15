import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";

const HtmlRenderer = ({ htmlString }) => {
  const renderNode = (node, index) => {
    if (node.type === "text") {
      return node.data; // 直接返回文本内容
    }

    if (node.type === "tag") {
      const TagName = node.name; // 动态组件
      const children = node.children.map((child, i) => renderNode(child, i));
      const props = node.attribs; // 使用节点的属性

      return (
        <TagName key={index} {...props}>
          {children}
        </TagName>
      );
    }

    return null; // 忽略注释和其他非标签节点
  };

  // 使用 htmlparser2 解析 HTML 字符串
  const dom = parseDocument(htmlString);
  const nodes = DomUtils.getChildren(dom);

  return <div>{nodes.map((node, index) => renderNode(node, index))}</div>;
};

export default HtmlRenderer;
