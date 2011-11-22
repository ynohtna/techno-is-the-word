class ContextFreeGrammar(object):

    def __init__(self, file_obj = None):
        self.rules = dict()
        if file_obj:
            self.parse_from_file(file_obj)

    # Rules are stored in self.rules, a dictionary.
    # The rules themselves are lists of expansions (which themselves are lists).
    def add_rule(self, rule, expansion):
        if rule in self.rules:
            self.rules[rule].append(expansion)
        else:
            self.rules[rule] = [expansion]

    def expand(self, start):
        # If the starting rule is in our set of rules, then we can expand it...
        if start in self.rules:
            possible_expansions = self.rules[start]

            # Choose an expansion from the possibilities.
            random_expansion = self.choose(possible_expansions)

            # Call this method again with the current element of the expansion.
            for elem in random_expansion:
                if elem in self.rules:
                    self.expand(elem)
                else:
                    # If the rule wasn't found, then it's a terminal and can
                    # be appended immediately to the expansion.
                    self.expansion.append(elem)

    # Utility method to run the expand method and return the results.
    def get_expansion(self, axiom):
        self.expansion = list()
        self.expand(axiom)
        return self.expansion

    # Method to choose 
    def choose(self, options):
        from random import choice
        return choice(options)


    # ----------------------------------------
    def parse_from_file(self, file_obj):
        import re

        # rules are stored in the given file in the following format:
        # Rule -> a | a b c | b c d
        # ... which will be translated to:
        # self.add_rule('Rule', ['a'])
        # self.add_rule('Rule', ['a', 'b', 'c'])
        # self.add_rule('Rule', ['b', 'c', 'd'])

        for line in file_obj:
            line = re.sub(r"#.*$", "", line) # get rid of comments
            line = line.strip() # strip any remaining white space

            match_obj = re.search(r"(\w+) *-> *(.*)", line)
            if match_obj:
                rule = match_obj.group(1)
                expansions = re.split(r"\s*\|\s*", match_obj.group(2))
                for expansion in expansions:
                    expansion_list = expansion.split(" ")
                    self.add_rule(rule, expansion_list)


# ============================================================
if __name__ == '__main__':
    cfree = ContextFreeGrammar()
    cfree.add_rule('S', ['NP', 'VP'])
    cfree.add_rule('NP', ['the', 'N'])
    cfree.add_rule('N', ['cat'])
    cfree.add_rule('N', ['dog'])
    cfree.add_rule('N', ['weinermobile'])
    cfree.add_rule('N', ['duchess'])
    cfree.add_rule('VP', ['V', 'the', 'N'])
    cfree.add_rule('V', ['sees'])
    cfree.add_rule('V', ['chases'])
    cfree.add_rule('V', ['lusts after'])
    cfree.add_rule('V', ['blames'])

    expansion = cfree.get_expansion('S')
    print ' '.join(expansion)

    cfree.add_rule('P', ['S', 'which', 'V', 'S'])
    expansion = cfree.get_expansion('P')
    print ' '.join(expansion)

    print

    # --------------------
    kick_rules = """
MEASURE -> B4 | B2 B2 | B1 B1 B1 B1

B4 -> X...X...X...X...
B4 -> X...X...X...X.x.
B4 -> X.x.X...X.x.X.x.
B4 -> X.x.X...X.x.X...
B4 -> X...x.x.....X...
B4 -> X...X.....x.X...
B4 -> X...X.x...x.X...
B4 -> X.........x.....
B4 -> X.....x...x.....
B4 -> X.....x....x....
B4 -> X..........x....

B2 -> X..x..x.
B2 -> X..X..x.
B2 -> X...x...
B2 -> X.xX..x.
B2 -> X..xX.x.

B1 -> X... | X..x | X.x.
"""
    import io
    cfg = ContextFreeGrammar(io.StringIO(kick_rules))

    expansion = cfg.get_expansion('MEASURE')
    print ''.join(expansion)
