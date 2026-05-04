from app.routers.feedback import _strip_tags


class TestStripTags:
    def test_removes_simple_tag(self):
        assert _strip_tags("<p>Hello</p>") == "Hello"

    def test_removes_nested_tags(self):
        assert _strip_tags("<b><i>text</i></b>") == "text"

    def test_leaves_plain_text_unchanged(self):
        assert _strip_tags("plain text") == "plain text"

    def test_removes_tag_with_attributes(self):
        assert _strip_tags('<a href="http://example.com">link</a>') == "link"

    def test_removes_self_closing_tag(self):
        assert _strip_tags("line<br/>next") == "linenext"

    def test_empty_string_returns_empty(self):
        assert _strip_tags("") == ""

    def test_only_tags_returns_empty_string(self):
        # A submission of only HTML tags becomes empty after stripping —
        # the endpoint should reject this with a 400
        assert _strip_tags("<p></p>") == ""

    def test_multiple_adjacent_tags(self):
        assert _strip_tags("<h1>Title</h1><p>Body</p>") == "TitleBody"

    def test_strips_tags_but_preserves_inner_content(self):
        # Tags are removed but the text between them is kept
        assert _strip_tags("<script>alert('xss')</script>") == "alert('xss')"
