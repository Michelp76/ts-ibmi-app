import React from 'react';
import { AutoSizer, List } from 'react-virtualized';
import { createElement } from 'react-syntax-highlighter';

function rowRenderer(_ref) {
  var rows = _ref.rows,
      stylesheet = _ref.stylesheet,
      useInlineStyles = _ref.useInlineStyles;
  return function (_ref2) {
    var index = _ref2.index,
        key = _ref2.key,
        style = _ref2.style;
    return createElement({
      node: rows[index],
      stylesheet: stylesheet,
      style: style,
      useInlineStyles: useInlineStyles,
      key: key
    });
  };
}

export default function virtualizedRenderer() {
  var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref3$overscanRowCoun = _ref3.overscanRowCount,
      overscanRowCount = _ref3$overscanRowCoun === void 0 ? 10 : _ref3$overscanRowCoun,
      _ref3$rowHeight = _ref3.rowHeight,
      rowHeight = _ref3$rowHeight === void 0 ? 15 : _ref3$rowHeight,
      _ref3$scrollToIndex = _ref3.scrollToIndex,
      scrollToIndex = _ref3$scrollToIndex === void 0 ? null : _ref3$scrollToIndex,
      _ref3$scrollToAlignme = _ref3.scrollToAlignment,
      scrollToAlignment = _ref3$scrollToAlignme === void 0 ? 'center' : _ref3$scrollToAlignme;

  return function (_ref4) {
    var rows = _ref4.rows,
        stylesheet = _ref4.stylesheet,
        useInlineStyles = _ref4.useInlineStyles;
    return React.createElement("div", {
      style: {
        height: '100%'
      }
    }, React.createElement(AutoSizer, null, function (_ref5) {
      var height = _ref5.height,
          width = _ref5.width;
      return React.createElement(List, {
        height: height,
        width: width,
        rowHeight: rowHeight,
        rowRenderer: rowRenderer({
          rows: rows,
          stylesheet: stylesheet,
          useInlineStyles: useInlineStyles
        }),
        rowCount: rows.length,
        overscanRowCount: overscanRowCount,
        scrollToIndex: scrollToIndex,
        scrollToAlignment: scrollToAlignment
      });
    }));
  };
}
