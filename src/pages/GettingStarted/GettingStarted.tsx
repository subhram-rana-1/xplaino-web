import React, { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CwsWalkthrough, CWS_WALKTHROUGH_KEY } from '@/shared/components/CwsWalkthrough';
import styles from './GettingStarted.module.css';

const BIOMOLECULES_DIAGRAM_URL = 'https://cdn.testbook.com/1737704974941-biomolecules%20concept%20map.png/1737704976.png';

const FAB_HINT_DISMISSED_KEY = 'xplaino_fab_hint_dismissed';

/** Animated arrow pointing right toward the Xplaino FAB */
const BouncingRightArrow: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    aria-hidden="true"
    className={styles.bouncingArrow}
  >
    <path
      d="M6 14H22M22 14L15 7M22 14L15 21"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GettingStarted: React.FC = () => {
  const location = useLocation();

  const isCwsSource = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('source') === 'cws';
  }, [location.search]);

  const [showWalkthrough, setShowWalkthrough] = useState(() => {
    if (!isCwsSource) return false;
    try { return localStorage.getItem(CWS_WALKTHROUGH_KEY) !== 'true'; } catch { return false; }
  });

  const [showFabHint, setShowFabHint] = useState(() => {
    try { return localStorage.getItem(FAB_HINT_DISMISSED_KEY) !== 'true'; } catch { return true; }
  });

  const dismissFabHint = useCallback(() => {
    setShowFabHint(false);
    try { localStorage.setItem(FAB_HINT_DISMISSED_KEY, 'true'); } catch { /* noop */ }
  }, []);

  return (
    <div className={styles.pageWrapper}>
      {showWalkthrough && (
        <CwsWalkthrough onComplete={() => setShowWalkthrough(false)} />
      )}

      <div className={styles.mainRow}>
        <aside className={styles.leftSidebar}>
          <div className={styles.instructionCallout}>
            <span className={styles.instructionCalloutText}>
              Try the Xplaino extension on this page — select any text, hover over an image, or double-click a word to see it in action.
            </span>
          </div>

          <div className={styles.useGuideSection}>
            <span className={styles.guideLabel}>Use guide</span>
            <ul className={styles.instructionsList}>
              <li>Select text</li>
              <li>Hover over an image</li>
              <li>Double-click word</li>
            </ul>
          </div>

          <div className={styles.refreshTabsBanner}>
            You&apos;re all set! Refresh any open tab or open a new one to start using Xplaino.
          </div>
        </aside>

        <div className={styles.mainCenter}>
          <article className={styles.article}>
          <h2 className={styles.articleTitle}>Human Biology: From Cells to Systems</h2>
          <div className={styles.articleBody}>

            <h2 className={styles.articleH2}>What Is Human Biology?</h2>
            <p className={styles.paragraph}>
              Human biology is the scientific study of how the human body functions, from the microscopic level of individual cells to the coordinated activity of entire organ systems. It draws on anatomy, physiology, biochemistry, and genetics to explain how we grow, move, think, and heal. By understanding human biology, researchers develop life-saving medicines, design better nutrition programs, and unlock the mechanisms behind ageing and disease.
            </p>

            <h2 className={styles.articleH2}>The Cell &mdash; Foundation of Life</h2>
            <p className={styles.paragraph}>
              Every living organism is built from cells, the smallest units capable of carrying out life&apos;s essential processes. The human body contains roughly 37 trillion cells, each enclosed by a plasma membrane that regulates the flow of nutrients, waste products, and signaling molecules. Despite their tiny size, cells maintain an intricate internal architecture of membrane-bound compartments called organelles.
            </p>

            <h3 className={styles.articleH3}>Key Organelles and Their Functions</h3>
            <ul className={styles.articleList}>
              <li><strong>Nucleus:</strong> Houses the cell&apos;s DNA and coordinates gene expression, growth, and reproduction. Often called the &ldquo;control centre&rdquo; of the cell.</li>
              <li><strong>Mitochondria:</strong> Generate adenosine triphosphate (ATP) through aerobic respiration, supplying the energy that powers nearly every cellular process.</li>
              <li><strong>Endoplasmic Reticulum (ER):</strong> The rough ER, studded with ribosomes, synthesizes proteins destined for secretion; the smooth ER metabolizes lipids and detoxifies drugs.</li>
              <li><strong>Golgi Apparatus:</strong> Receives proteins from the ER, modifies and packages them into vesicles for transport to the plasma membrane or to lysosomes.</li>
              <li><strong>Lysosomes:</strong> Contain digestive enzymes that break down worn-out organelles, bacteria, and macromolecules, recycling their components for reuse.</li>
              <li><strong>Ribosomes:</strong> Molecular machines composed of RNA and protein that translate messenger RNA into polypeptide chains during protein synthesis.</li>
              <li><strong>Cytoskeleton:</strong> A network of microtubules, microfilaments, and intermediate filaments that maintains cell shape, enables movement, and organizes internal transport.</li>
            </ul>
            <p className={styles.paragraph}>
              Together, these organelles form an efficient assembly line. Damage to any single component &mdash; for example, mitochondrial dysfunction &mdash; can trigger diseases ranging from chronic fatigue syndromes to neurodegenerative disorders like Parkinson&apos;s disease.
            </p>

            <h3 className={styles.articleH3}>Cell Division</h3>
            <p className={styles.paragraph}>
              Cells reproduce through two main mechanisms: mitosis and meiosis. Mitosis produces two genetically identical daughter cells and is responsible for growth and tissue repair throughout the body. Meiosis, on the other hand, halves the chromosome number and introduces genetic variation, creating the gametes &mdash; sperm and egg cells &mdash; needed for sexual reproduction.
            </p>

            <h2 className={styles.articleH2}>Biomolecules: The Chemistry of Life</h2>
            <p className={styles.paragraph}>
              All biological functions ultimately depend on chemistry. The four major classes of biomolecules &mdash; carbohydrates, proteins, lipids, and nucleic acids &mdash; interact in tightly regulated networks to sustain life. Understanding their structures and roles is central to biochemistry, pharmacology, and nutritional science.
            </p>

            <figure className={styles.workflowFigure}>
              <img
                src={BIOMOLECULES_DIAGRAM_URL}
                alt="Four major classes of biomolecules: carbohydrates, proteins, lipids, nucleic acids"
                className={styles.workflowDiagram}
              />
              <figcaption className={styles.workflowCaption}>
                Four major classes of biomolecules &mdash; hover to try Xplaino
              </figcaption>
            </figure>

            <h3 className={styles.articleH3}>Carbohydrates</h3>
            <p className={styles.paragraph}>
              Carbohydrates are the body&apos;s preferred quick-release fuel. Simple sugars such as glucose enter glycolysis almost immediately, while complex polysaccharides like glycogen are stored in the liver and muscles for later use. Dietary fibre, another carbohydrate, cannot be digested but supports gut health by feeding beneficial bacteria in the large intestine.
            </p>

            <h3 className={styles.articleH3}>Proteins</h3>
            <p className={styles.paragraph}>
              Proteins are polymers of amino acids folded into precise three-dimensional shapes. Their functions are extraordinarily diverse: enzymes catalyse biochemical reactions, antibodies neutralise pathogens, haemoglobin transports oxygen, and collagen provides structural support to skin, tendons, and bones. A single misfolded protein can cause disorders such as sickle-cell anaemia or cystic fibrosis.
            </p>

            <h3 className={styles.articleH3}>Lipids</h3>
            <p className={styles.paragraph}>
              Lipids include fats, phospholipids, and steroids. Phospholipids form the bilayer of every cell membrane, creating a selective barrier between the cell and its environment. Triglycerides store energy at roughly double the caloric density of carbohydrates, serving as long-term fuel reserves. Cholesterol, a steroid lipid, is a precursor to vitamin D, bile salts, and steroid hormones like cortisol and oestrogen.
            </p>

            <h3 className={styles.articleH3}>Nucleic Acids</h3>
            <p className={styles.paragraph}>
              Deoxyribonucleic acid (DNA) and ribonucleic acid (RNA) carry and transmit genetic information. DNA&apos;s double helix stores the complete blueprint for building every protein in the body, while messenger RNA (mRNA) ferries that information to ribosomes for translation. Transfer RNA and ribosomal RNA play supporting roles that ensure the genetic code is read accurately.
            </p>

            <h2 className={styles.articleH2}>The Nervous System</h2>
            <p className={styles.paragraph}>
              The nervous system is the body&apos;s command-and-control network. It detects changes in the internal and external environment, processes that information, and orchestrates appropriate responses &mdash; from pulling your hand away from a hot surface to composing a piece of music.
            </p>

            <h3 className={styles.articleH3}>Central Nervous System</h3>
            <p className={styles.paragraph}>
              The central nervous system (CNS) comprises the brain and spinal cord. The brain, weighing about 1.4 kilograms, contains roughly 86 billion neurons organised into regions that govern sensation, movement, emotion, memory, and higher-order reasoning. The spinal cord acts as a high-speed conduit relaying signals between the brain and the rest of the body, and it mediates simple reflex arcs independently.
            </p>

            <h3 className={styles.articleH3}>Peripheral Nervous System</h3>
            <p className={styles.paragraph}>
              The peripheral nervous system (PNS) consists of all nerves branching out from the brain and spinal cord. It is subdivided into the somatic nervous system, which controls voluntary movements, and the autonomic nervous system, which regulates involuntary functions such as heart rate, digestion, and pupil dilation.
            </p>

            <h3 className={styles.articleH3}>Types of Neurons</h3>
            <ul className={styles.articleList}>
              <li><strong>Sensory neurons:</strong> Carry signals from receptors in the skin, eyes, ears, and other organs toward the CNS. They convert stimuli like light, pressure, and temperature into electrical impulses.</li>
              <li><strong>Motor neurons:</strong> Transmit commands from the CNS to muscles and glands, enabling movement and secretion. Damage to motor neurons underlies diseases such as amyotrophic lateral sclerosis (ALS).</li>
              <li><strong>Interneurons:</strong> Located entirely within the CNS, they connect sensory and motor neurons and are responsible for processing, integration, and decision-making within neural circuits.</li>
              <li><strong>Mirror neurons:</strong> Fire both when an individual performs an action and when they observe the same action performed by another. They are thought to play a role in empathy and learning through imitation.</li>
              <li><strong>Purkinje cells:</strong> Large, elaborately branched neurons found in the cerebellum. They coordinate fine motor movements and maintain balance and posture.</li>
            </ul>
            <p className={styles.paragraph}>
              Neurons communicate across tiny gaps called synapses by releasing chemical messengers known as neurotransmitters. Dopamine, serotonin, and acetylcholine are among the best-studied neurotransmitters, and imbalances in their levels are linked to conditions such as depression, Parkinson&apos;s disease, and myasthenia gravis.
            </p>

            <h3 className={styles.articleH3}>How Nerve Signals Travel</h3>
            <p className={styles.paragraph}>
              An action potential begins when a stimulus depolarises a neuron&apos;s membrane past its threshold voltage of about &minus;55 millivolts. Voltage-gated sodium channels open, allowing sodium ions to rush in and reversing the membrane polarity. The signal propagates along the axon at speeds up to 120 metres per second in myelinated fibres, ultimately reaching the axon terminal where it triggers neurotransmitter release.
            </p>
            <blockquote className={styles.articleBlockquote}>
              &ldquo;The brain is wider than the sky.&rdquo; &mdash; Emily Dickinson. Modern neuroscience continues to reveal just how vast the brain&apos;s capabilities truly are, with an estimated 100 trillion synaptic connections forming the basis of every thought and memory.
            </blockquote>

            <h2 className={styles.articleH2}>The Circulatory System</h2>
            <p className={styles.paragraph}>
              The circulatory system is a vast transportation network that delivers oxygen, nutrients, hormones, and immune cells to every tissue and carries away carbon dioxide and metabolic waste. It consists of the heart, blood vessels, and approximately five litres of blood circulating through the body at any given moment.
            </p>

            <h3 className={styles.articleH3}>The Heart</h3>
            <p className={styles.paragraph}>
              The human heart is a muscular organ roughly the size of a clenched fist, beating an average of 100,000 times per day. It is divided into four chambers: the right atrium and right ventricle pump deoxygenated blood to the lungs, while the left atrium and left ventricle propel oxygenated blood to the rest of the body through the aorta.
            </p>

            <h3 className={styles.articleH3}>Blood Components</h3>
            <table className={styles.articleTable}>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Percentage of Blood</th>
                  <th>Primary Function</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Red Blood Cells</td>
                  <td>~45%</td>
                  <td>Transport oxygen via haemoglobin and carry carbon dioxide back to the lungs</td>
                </tr>
                <tr>
                  <td>White Blood Cells</td>
                  <td>~1%</td>
                  <td>Defend the body against infection through phagocytosis, antibody production, and immune surveillance</td>
                </tr>
                <tr>
                  <td>Platelets</td>
                  <td>&lt;1%</td>
                  <td>Initiate blood clotting at wound sites by aggregating and releasing clotting factors</td>
                </tr>
                <tr>
                  <td>Plasma</td>
                  <td>~54%</td>
                  <td>Liquid matrix that carries dissolved nutrients, hormones, waste products, and proteins like albumin and fibrinogen</td>
                </tr>
              </tbody>
            </table>
            <p className={styles.paragraph}>
              The balance among these components is critical. Anaemia &mdash; a deficiency of red blood cells or haemoglobin &mdash; reduces oxygen delivery and causes fatigue, while thrombocytopenia &mdash; a low platelet count &mdash; increases the risk of uncontrolled bleeding.
            </p>

            <h3 className={styles.articleH3}>Blood Pressure</h3>
            <p className={styles.paragraph}>
              Blood pressure is the force exerted by circulating blood on the walls of arteries. It is measured in millimetres of mercury (mmHg) and expressed as systolic over diastolic pressure. A normal reading is approximately 120/80 mmHg. Chronic hypertension silently damages blood vessels and increases the risk of heart attack, stroke, and kidney failure.
            </p>

            <h2 className={styles.articleH2}>The Digestive System</h2>
            <p className={styles.paragraph}>
              The digestive system breaks down food into nutrients small enough to be absorbed into the bloodstream and distributed to cells throughout the body. This process involves both mechanical actions &mdash; such as chewing and churning &mdash; and chemical digestion by enzymes and acids.
            </p>

            <h3 className={styles.articleH3}>Journey of Food Through the Body</h3>
            <ol className={styles.articleList}>
              <li><strong>Mouth:</strong> Digestion begins as teeth mechanically break food into smaller pieces. Salivary amylase starts splitting starch into maltose, and the tongue shapes food into a bolus for swallowing.</li>
              <li><strong>Oesophagus:</strong> Rhythmic muscular contractions called peristalsis push the bolus downward to the stomach in about five to eight seconds, regardless of body position.</li>
              <li><strong>Stomach:</strong> Gastric glands secrete hydrochloric acid (pH 1.5&ndash;3.5) and pepsin, creating a harsh environment that kills bacteria and begins protein digestion. The stomach churns food into a semi-liquid called chyme.</li>
              <li><strong>Small intestine:</strong> Most chemical digestion and nutrient absorption occur here. Bile from the liver emulsifies fats, pancreatic enzymes break down carbohydrates, proteins, and lipids, and villi increase the absorptive surface area to roughly 250 square metres.</li>
              <li><strong>Large intestine:</strong> Water and electrolytes are reabsorbed from indigestible residue. Trillions of gut bacteria ferment dietary fibre, producing short-chain fatty acids and vitamins like biotin and vitamin K.</li>
              <li><strong>Rectum and anus:</strong> The remaining waste is compacted into faeces, stored briefly in the rectum, and eliminated through the anus via the defecation reflex.</li>
            </ol>

            <h3 className={styles.articleH3}>Digestive Enzymes</h3>
            <ul className={styles.articleList}>
              <li><strong>Amylase:</strong> Produced by the salivary glands and pancreas. Breaks down starch into simple sugars. Active at a neutral pH, making it effective in the mouth and small intestine.</li>
              <li><strong>Pepsin:</strong> Secreted as inactive pepsinogen by gastric chief cells. Activated by hydrochloric acid in the stomach. Cleaves proteins into shorter peptide fragments.</li>
              <li><strong>Lipase:</strong> Released primarily by the pancreas. Hydrolyses triglycerides into fatty acids and glycerol after bile salts emulsify fat droplets in the small intestine.</li>
              <li><strong>Trypsin:</strong> A pancreatic enzyme that continues protein digestion begun by pepsin. Trypsin also activates other pancreatic enzymes, making it a key regulatory protease.</li>
            </ul>
            <p className={styles.paragraph}>
              Enzyme deficiencies can severely disrupt digestion. Lactose intolerance, for example, results from inadequate production of lactase, leading to gas, bloating, and diarrhoea when dairy products are consumed.
            </p>

            <h2 className={styles.articleH2}>The Respiratory System</h2>
            <p className={styles.paragraph}>
              The respiratory system supplies oxygen to the blood and expels carbon dioxide, a waste product of cellular metabolism. It includes the nasal passages, pharynx, larynx, trachea, bronchi, and lungs. An adult at rest breathes about 12 to 20 times per minute, moving approximately 500 millilitres of air with each breath.
            </p>

            <h3 className={styles.articleH3}>Gas Exchange</h3>
            <p className={styles.paragraph}>
              Gas exchange occurs in the alveoli, tiny air sacs numbering around 300 million in each lung. Their thin walls &mdash; just one cell thick &mdash; and extensive capillary network create an enormous surface area of about 70 square metres for diffusion. Oxygen moves from the alveoli into the blood, binding to haemoglobin in red blood cells, while carbon dioxide diffuses in the opposite direction to be exhaled.
            </p>

            <h3 className={styles.articleH3}>Breathing Mechanics</h3>
            <ul className={styles.articleList}>
              <li><strong>Inhalation:</strong> The diaphragm contracts and flattens while the external intercostal muscles lift the ribcage. This increases thoracic volume, lowers intra-pulmonary pressure, and draws air into the lungs.</li>
              <li><strong>Exhalation:</strong> During quiet breathing, exhalation is largely passive. The diaphragm and intercostals relax, the elastic recoil of the lungs compresses the alveoli, and air flows out.</li>
              <li><strong>Forced breathing:</strong> During exercise, accessory muscles in the neck and abdomen contract to increase both the rate and depth of ventilation, meeting the higher oxygen demands of active tissues.</li>
            </ul>
            <blockquote className={styles.articleBlockquote}>
              The total surface area of the alveoli in an adult&apos;s lungs is roughly equal to half a tennis court. This remarkable design allows the body to exchange gases efficiently enough to support vigorous physical activity.
            </blockquote>

            <h2 className={styles.articleH2}>The Endocrine System</h2>
            <p className={styles.paragraph}>
              The endocrine system uses chemical messengers called hormones to regulate growth, metabolism, reproduction, mood, and the body&apos;s response to stress. Unlike the rapid electrical signals of the nervous system, hormonal signals travel through the bloodstream and often take seconds to minutes to produce their effects, which can last hours or even days.
            </p>

            <h3 className={styles.articleH3}>Key Hormones and Their Roles</h3>
            <table className={styles.articleTable}>
              <thead>
                <tr>
                  <th>Hormone</th>
                  <th>Gland</th>
                  <th>Primary Function</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Insulin</td>
                  <td>Pancreas (beta cells)</td>
                  <td>Lowers blood glucose by promoting uptake into cells and glycogen synthesis in the liver</td>
                </tr>
                <tr>
                  <td>Glucagon</td>
                  <td>Pancreas (alpha cells)</td>
                  <td>Raises blood glucose by stimulating glycogenolysis and gluconeogenesis in the liver</td>
                </tr>
                <tr>
                  <td>Thyroxine (T4)</td>
                  <td>Thyroid</td>
                  <td>Regulates basal metabolic rate, body temperature, and energy expenditure in nearly every tissue</td>
                </tr>
                <tr>
                  <td>Cortisol</td>
                  <td>Adrenal cortex</td>
                  <td>Mobilises energy stores during stress, suppresses inflammation, and modulates immune function</td>
                </tr>
                <tr>
                  <td>Oestrogen</td>
                  <td>Ovaries</td>
                  <td>Drives development of female secondary sexual characteristics and regulates the menstrual cycle</td>
                </tr>
                <tr>
                  <td>Testosterone</td>
                  <td>Testes</td>
                  <td>Promotes muscle mass, bone density, and male secondary sexual characteristics such as facial hair</td>
                </tr>
              </tbody>
            </table>
            <p className={styles.paragraph}>
              Hormonal imbalances underlie many common health conditions. Diabetes mellitus results from insufficient insulin production (type 1) or cellular resistance to insulin (type 2). Hypothyroidism, caused by low thyroxine output, leads to fatigue, weight gain, and cold intolerance.
            </p>

            <h2 className={styles.articleH2}>Genetics and Heredity</h2>
            <p className={styles.paragraph}>
              Genetics is the branch of biology concerned with how traits are transmitted from parents to offspring through genes. The complete set of an organism&apos;s genetic material &mdash; its genome &mdash; is encoded in DNA and organised into chromosomes. Humans possess 23 pairs of chromosomes, for a total of 46 in most cells.
            </p>

            <h3 className={styles.articleH3}>DNA and the Genetic Code</h3>
            <p className={styles.paragraph}>
              Each DNA molecule is a double helix consisting of two sugar-phosphate backbones linked by complementary base pairs: adenine with thymine, and cytosine with guanine. The sequence of these bases constitutes the genetic code, which is read in triplets called codons. Each codon specifies one of 20 amino acids or a stop signal, enabling the cell to translate a gene into a functional protein.
            </p>

            <h3 className={styles.articleH3}>Mendel&apos;s Laws</h3>
            <ul className={styles.articleList}>
              <li><strong>Law of Segregation:</strong> Each organism carries two copies (alleles) of every gene &mdash; one inherited from each parent. During gamete formation, these alleles separate so that each gamete carries only one copy.</li>
              <li><strong>Law of Independent Assortment:</strong> Genes located on different chromosomes are inherited independently of one another. This principle explains why traits like eye colour and blood type can be passed down in seemingly random combinations.</li>
              <li><strong>Law of Dominance:</strong> When two different alleles are present, one (dominant) may mask the expression of the other (recessive). A person carrying one dominant and one recessive allele will display the dominant phenotype.</li>
            </ul>
            <p className={styles.paragraph}>
              Modern genetics has expanded far beyond Mendel&apos;s pea-plant experiments. Techniques like CRISPR-Cas9 gene editing now allow scientists to precisely modify DNA sequences, opening the door to potential cures for genetic diseases such as sickle-cell anaemia and muscular dystrophy.
            </p>

            <h2 className={styles.articleH2}>The Immune System</h2>
            <p className={styles.paragraph}>
              The immune system is the body&apos;s defence network, tasked with identifying and neutralising pathogens &mdash; bacteria, viruses, fungi, and parasites &mdash; while distinguishing them from the body&apos;s own healthy cells. It operates through two interconnected branches: innate immunity and adaptive immunity.
            </p>

            <h3 className={styles.articleH3}>Innate Immunity</h3>
            <p className={styles.paragraph}>
              Innate immunity provides the first line of defence and responds within minutes to hours. Physical barriers like the skin and mucous membranes block pathogen entry, while chemical defences such as stomach acid and antimicrobial peptides destroy invaders on contact. If pathogens breach these barriers, phagocytic cells like macrophages and neutrophils engulf and digest them.
            </p>

            <h3 className={styles.articleH3}>Adaptive Immunity</h3>
            <p className={styles.paragraph}>
              Adaptive immunity develops more slowly but produces a highly specific response tailored to each pathogen. It relies on two main types of lymphocytes: B cells, which produce antibodies that neutralise extracellular pathogens, and T cells, which destroy infected host cells directly. Crucially, adaptive immunity generates memory cells that enable a faster and stronger response upon re-exposure to the same pathogen &mdash; the principle underlying vaccination.
            </p>

            <h3 className={styles.articleH3}>Types of Immune Cells</h3>
            <ul className={styles.articleList}>
              <li><strong>Macrophages:</strong> Large phagocytic cells that patrol tissues, engulf debris and microbes, and present antigens to T cells to initiate adaptive responses.</li>
              <li><strong>Neutrophils:</strong> The most abundant white blood cells. They are rapid responders that swarm to infection sites, phagocytose bacteria, and release antimicrobial enzymes.</li>
              <li><strong>B Lymphocytes:</strong> Produce antibodies (immunoglobulins) tailored to specific antigens. Some differentiate into long-lived memory B cells for lasting immunity.</li>
              <li><strong>Helper T Cells (CD4+):</strong> Coordinate immune responses by releasing cytokines that activate B cells, cytotoxic T cells, and macrophages. They are the primary target of HIV.</li>
              <li><strong>Cytotoxic T Cells (CD8+):</strong> Directly kill virus-infected cells and tumour cells by releasing perforin and granzymes that trigger apoptosis.</li>
            </ul>
            <blockquote className={styles.articleBlockquote}>
              Vaccination works by training the adaptive immune system. A vaccine introduces a harmless form of a pathogen &mdash; such as an inactivated virus or a fragment of its surface protein &mdash; so the body can build memory without suffering the disease.
            </blockquote>

            <h2 className={styles.articleH2}>Homeostasis</h2>
            <p className={styles.paragraph}>
              Homeostasis is the body&apos;s ability to maintain stable internal conditions despite external changes. Temperature, blood pH, glucose levels, and fluid balance are all kept within narrow ranges through feedback loops involving sensors, control centres (often in the brain), and effectors such as muscles and glands.
            </p>

            <h3 className={styles.articleH3}>Temperature Regulation</h3>
            <p className={styles.paragraph}>
              The hypothalamus acts as the body&apos;s thermostat. When core temperature rises above 37&nbsp;&deg;C, it triggers vasodilation of skin blood vessels and activates sweat glands, promoting heat loss through radiation and evaporation. When temperature drops, the hypothalamus initiates vasoconstriction to conserve heat and stimulates shivering &mdash; rapid involuntary muscle contractions that generate warmth.
            </p>

            <h3 className={styles.articleH3}>Blood Sugar Regulation</h3>
            <p className={styles.paragraph}>
              After a meal, rising blood glucose stimulates the pancreatic beta cells to secrete insulin. Insulin signals liver, muscle, and fat cells to absorb glucose, lowering blood sugar back toward the set point of about 5 mmol/L. Between meals, falling glucose triggers alpha cells to release glucagon, which promotes the breakdown of stored glycogen in the liver and the production of new glucose molecules through gluconeogenesis.
            </p>

            <h2 className={styles.articleH2}>Key Takeaways</h2>
            <ol className={styles.articleList}>
              <li>Cells are the fundamental building blocks of life. With 37 trillion cells working together, the human body is a marvel of coordination, each cell type specialised for a particular role.</li>
              <li>Biomolecules &mdash; carbohydrates, proteins, lipids, and nucleic acids &mdash; drive every biological process, from energy production to genetic inheritance and immune defence.</li>
              <li>The nervous system enables rapid communication through electrical impulses and neurotransmitters, while the endocrine system provides slower but longer-lasting regulation through hormones.</li>
              <li>The circulatory and respiratory systems work in concert to deliver oxygen and remove carbon dioxide, sustaining aerobic metabolism in every tissue.</li>
              <li>Digestion transforms complex food into absorbable nutrients through a coordinated sequence of mechanical and chemical processes spanning from the mouth to the large intestine.</li>
              <li>Homeostasis maintains the internal stability essential for survival, relying on feedback loops that continuously adjust temperature, blood sugar, pH, and fluid balance.</li>
            </ol>

          </div>
        </article>
        </div>

        {showFabHint && (
          <aside className={styles.rightSidebar}>
            <div className={styles.fabInstruction}>
              <div className={styles.fabInstructionContent}>
                <span>
                  Look for the <strong>Xplaino icon</strong> in the top-right corner of the screen — hover over it to open the Xplaino panel.
                </span>
                <button
                  className={styles.fabDismissBtn}
                  onClick={dismissFabHint}
                  aria-label="Dismiss hint"
                >
                  Hide
                </button>
              </div>
              <BouncingRightArrow />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

GettingStarted.displayName = 'GettingStarted';
