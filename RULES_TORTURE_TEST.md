# Oddball Digital V2 — Rules Torture Test

Purpose: validate the Claude foundation against the rules and edge cases already established during V1 playtesting before any visual migration.

## Status legend
- PASS: implementation inspected/tested and consistent with V1 rule.
- GAP: known behavior differs from the current V1 rule.
- LATENT: architecture does not guarantee the V1 rule even if current cards rarely expose it.
- PROVISIONAL: rule itself still needs author confirmation.

## First audit

| Scenario | Status | Notes |
|---|---|---|
| Defender Wild auto-matches requested color | PASS | Engine uses WILD_DEFENDER_AUTOMATCH and assigns the requested color. |
| Printed color remains intrinsic for color abilities | PASS | Ability checks use printed card definition rather than the temporary Wild choice. |
| Face-down Bench card has no stats/text/Permanent | PASS | stats() returns zeroed state; rawPerm() rejects face-down cards. |
| Permanent activates only after reaching Bench | PASS | Face-Off card is not in activePerms until placement. |
| Permanent source flipped during a chain stops contributing | PASS | trigger() re-checks isActive before resolving each queued source. |
| Defender color mismatch still gets Play/Defense effects | PASS | Effects resolve in playCard() before color check in resolve(). |
| POW tie goes to attacker | PASS / PROVISIONAL | Centralized in RULES. |
| SPD tie goes to attacker | PASS / PROVISIONAL | Centralized in RULES. |
| Win resolves before Lose | PASS / PROVISIONAL | Centralized in RULES. |
| Speed resolves before After | PASS | afterFaceOff hook is called after speed winner is set. |
| Asta replacement becomes the attacking Face-Off card | PASS | Asta is discarded then playCard() replaces fo.atk. |
| Flip targets Bench only | PASS / PROVISIONAL | flip() rejects non-Bench targets. |
| Ravi blocks hostile Flip during current Face-Off | PASS | fo.protect is checked by flip(). |
| Omar redirects hostile Flip | PASS / PROVISIONAL | Implemented once per Face-Off; face-up-only behavior centralized in RULES. |
| End Game board manipulation before star scoring | PASS | Hattie is resolved before End Game points and Winzone stars. |
| Akira cancellation before End Game scoring | PASS / PROVISIONAL | Dedicated cancellation phase. |
| Final ball = +2 | PASS | Centralized BALL_BONUS. |
| Face-down Winzone = 1 star | PASS | Mina override also handled. |
| Opponent already has 0 cards before a new attack | PASS | canContinue() ends the game before another Face-Off. |
| Attacker effect empties defender hand before defense | PASS | faceOff() checks defender hand after attack resolution and awards auto-win. |
| Same-player simultaneous effects: player chooses order | PASS (V2 fix) | trigger() now asks the owning player to choose the next simultaneous Permanent; active state is re-checked after every resolution. Regression test added. |
| SPD snapshot after POW result | PASS (V2 fix) | SPD is now snapshotted at POW resolution and WIN/LOSE cannot retroactively rewrite possession. Synthetic regression test added. |
| Sora/Eli pair definition | PROVISIONAL | Claude uses disjoint pairs. Needs author confirmation. |
| Samir/Tessa mirror suppression | PROVISIONAL | Claude chooses both-disabled. Needs author confirmation. |
| Aya normal Face-Off placement counts as zone move | PROVISIONAL | Claude says no. Needs author confirmation. |
| Wally cross-player swap ownership | PROVISIONAL | Claude changes ownership. Needs author confirmation. |

## Torture scenarios\n\nImplemented in local V2 foundation: simultaneous-effect ordering, explicit SPD snapshot regression, disappearing queued Permanent source, Bea native/dynamic Wild suppression, Ravi/Omar/June/Mika Flip-chain ordering, Bench orientation retention/hand reset, and Kira face-up reaction. Full suite now: **49 targeted engine tests + 500 AI-vs-AI matches, 0 failures/errors**.\n\n## Torture scenarios to automate next

1. ~~Flip a Permanent source during a trigger chain and prove later queued contribution disappears.~~ — DONE.
2. ~~Native Wild vs dynamically Wild vs Bea Collins anti-Wild, while checking printed-color abilities.~~ — DONE.
3. Asta replacement into Play + Attack chain, including requested color and final placement.
4. Defender loses on mismatch but still executes Play/Defense and resulting draws/discards.
5. Attacker removes defender's last card before defense; verify auto-win, Win effect, placement, then immediate end.
6. Hattie flips an End Game card before scoring; verify text and printed stars are disabled before totals.
7. Akira vs multiple End Game cards and opposing Akira; document ordering behavior.
8. ~~Omar + Ravi + June/Mika on the same hostile Flip; Kira face-up reaction separately.~~ — DONE.
9. Samir/Tessa suppression with a third Permanent in each affected zone.
10. Explicit SPD snapshot regression test using a synthetic effect that mutates/replaces a current Face-Off card after POW but before SPD.
11. Two simultaneous same-player reactive Permanents where order changes the result; require a player decision instead of Bench-order resolution.
12. ~~Zone movement retaining face orientation, then return-to-hand forcing face-up.~~ — DONE.

## Gate for V2 visual work

Do not alter Claude's visual identity until:
- confirmed V1 rules are green;
- GAP/LATENT items above are fixed or explicitly accepted;
- provisional interpretations remain centralized and visible;
- the existing Claude test suite remains green.
