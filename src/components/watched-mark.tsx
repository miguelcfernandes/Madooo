/**
 * The mark on a fixture the reader has written in: a 2px rule down the row's
 * leading edge, and nothing else.
 *
 * **It replaced two tallies, and the argument is what the numbers were for.** A
 * row used to end `7 verdicts · 1 note` — two glyphs, two counts and two nouns
 * in the margin of a line that already carries a kickoff, two clubs, two crests
 * and a score. Neither number is a fact about the fixture. They are facts about
 * how much the reader typed, and nothing on a page of fixtures is decided by
 * whether that was seven verdicts or two: the reader is scanning for *which*
 * matches they have been in, and the counts are on the match page a click away,
 * spelled out as the verdicts themselves rather than as a total.
 *
 * **A word in the right margin was built first and rejected, and the reason is
 * worth keeping.** WATCHED, in the `visibility` glyph and full ink, agreed with
 * the Watched tile at the top of the page exactly — same word, same glyph, same
 * ink, the tile counting the marks. It was still wrong twice over. It took 96px
 * of the row's width on every row, since a margin that appears and disappears
 * walks the centred score sideways and the width has to be held whether the mark
 * is drawn or not; and a bold capitalised word is not what a private note in the
 * margin of a fixture list should sound like. **This is the reader's own mark on
 * a page about football, so it should read as a mark and not as a label.**
 *
 * A rule down the edge is what a marked page looks like — the pencil line beside
 * the paragraph you came back for. It says one thing, it says it in the one
 * place a column of rows shares, and a Saturday of twenty-eight fixtures with
 * three of them marked reads at a glance without any of the twenty-five paying
 * for it.
 */

/**
 * **Absolutely positioned, rather than a left border on the row.** A `border-l-2`
 * would push the row's content 2px right of the block header above it, which has
 * the same `px-4` and no border — so every row on the page would sit off its own
 * header to buy a mark two rows in three do not draw. Out of flow, the bar costs
 * no layout at all: nothing moves, and there is no transparent border to hold a
 * width with.
 *
 * The caller supplies the positioning context — `relative` on the row — and
 * draws this only on a watched fixture. `inset-y-0` runs the bar the full height
 * of the row, so the dividers cut a column of marks into rows rather than the
 * bar floating inside one.
 *
 * **Marine, at 2px.** It took two steps to get here and both are worth keeping.
 * `--border-strong` first — the grey foundations reserves for a rule meant to be
 * noticed — which at 2px against a white row read as the card's own border having
 * thickened rather than as anything deliberate. Then ink, which read clearly and
 * said nothing: a near-black line beside a near-black club name is the same voice
 * the row is already speaking in. Widening the pale bar to 4px was tried in
 * between and is the worst of the three — it stops being a line and becomes a
 * soft block, and this design has two rule weights rather than three. **A mark
 * gets a colour, not a width.**
 *
 * **This is marine's second category — where you are — read one tense back.** The
 * brand marks what you can act on, where you are, and where the brand is
 * speaking. "Where you are" is already drawn as a 2px marine rule under the
 * selected tab, sitting under that tab alone and never spanning the strip; this
 * is structurally the same object turned on its side, down one row alone and
 * never spanning the block. The difference is tense: a tab underline says *here*,
 * and this says *you have been here*. Both are the app telling the reader where
 * they stand in their own diary, which is what separates them from the block
 * header's rule — that one is the brand naming a thing, not locating a reader.
 *
 * `foundations.md` carries the clause. It also had to correct a sentence that was
 * already wrong before this mark existed: it claimed a marine line must be
 * "the bottom of a block header" or it is wrong, which the selected tab's
 * underline had been contradicting since it was drawn.
 *
 * The bar carries no text, so the word rides along `sr-only`: a rule down an edge
 * says nothing to a screen reader, and colour alone is never the whole of a fact.
 */
export function WatchedMark() {
  return (
    <>
      <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-brand" />
      <span className="sr-only">Watched</span>
    </>
  )
}
