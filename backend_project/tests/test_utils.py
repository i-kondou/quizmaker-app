import ast
import os
import typing


def load_get_unesco_tag():
    """Dynamically extract get_unesco_tag from heritage module without importing
    the heavy dependencies."""
    path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'routers', 'heritage.py')
    path = os.path.abspath(path)
    with open(path, 'r', encoding='utf-8') as f:
        source = f.read()
    module_ast = ast.parse(source)
    func_node = None
    for node in module_ast.body:
        if isinstance(node, ast.FunctionDef) and node.name == 'get_unesco_tag':
            func_node = node
            break
    assert func_node is not None, 'get_unesco_tag not found'
    mod_ast = ast.Module([func_node], type_ignores=[])
    namespace = {'List': typing.List, 'Optional': typing.Optional}
    exec(compile(mod_ast, path, 'exec'), namespace)
    return namespace['get_unesco_tag']


get_unesco_tag = load_get_unesco_tag()


import pytest

@pytest.mark.parametrize('criteria,expected', [
    ([1], "文化遺産"),
    ([7], "自然遺産"),
    ([1, 7], "複合遺産"),
])
def test_get_unesco_tag_valid(criteria, expected):
    assert get_unesco_tag(criteria) == expected


@pytest.mark.parametrize('criteria', [
    None,
    [],
    [11],
])
def test_get_unesco_tag_invalid(criteria):
    assert get_unesco_tag(criteria) is None
